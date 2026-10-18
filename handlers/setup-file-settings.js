const fs = require('node:fs/promises')
const path = require('node:path')
const { createHash, randomBytes } = require('node:crypto')
const { z } = require('zod')
const { runSetupOperation } = require('./setup-operations')
const queues = new Map()
const hash = value => createHash('sha256').update(value).digest('hex')
const fail = code => { throw Object.assign(new Error(code), { code }) }
function sequence(file, operation) {
  const result = (queues.get(file) || Promise.resolve()).catch(() => {}).then(operation)
  queues.set(file, result)
  void result.then(clean, clean)
  function clean() { if (queues.get(file) === result) queues.delete(file) }
  return result
}
// Trusted callers declare the file and top-level fields. Snapshots never contain other keys.
function createFileSettings(client, { file, fields, authorize, validate, publish, observe }) {
  file = path.resolve(file)
  const keys = Object.keys(fields)
  if (!keys.length || keys.some(key => !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) || ['__proto__','constructor','prototype'].includes(key))) throw Error('invalid_setup_definition')
  const schema = z.strictObject(Object.fromEntries(keys.map(key => [key, fields[key].schema]))).partial().refine(v=>Object.keys(v).length>0 && Object.values(v).every(v=>v!==undefined))
  async function readFile() {
    const stat = await fs.lstat(file)
    if (!stat.isFile() || stat.isSymbolicLink()) fail('setup_storage')
    const raw = await fs.readFile(file, 'utf8')
    const document = JSON.parse(raw)
    if (!document || typeof document !== 'object' || Array.isArray(document)) fail('setup_storage')
    return { raw, document, mode: stat.mode & 0o777 }
  }
  const snapshot = document => { const values = Object.fromEntries(keys.map(key=>[key,structuredClone(Object.hasOwn(document,key)?document[key]:fields[key].default)])); return { values, revision: hash(JSON.stringify(values)) } }
  const sanitized = async operation => { try { return await operation() } catch(error) { if (['setup_conflict','invalid_setup','setup_denied','setup_unavailable'].includes(error.code)) throw error; fail('setup_storage') } }
  return {
    read() { return sanitized(()=>sequence(file,async()=>{const {document}=await readFile();await authorize?.(document);observe?.(document);return snapshot(document)})) },
    save(_key, input, revision) {
      return runSetupOperation(client,()=>sanitized(()=>sequence(file,async()=>{
        const parsed=schema.safeParse(input)
        if (!parsed.success) fail('invalid_setup')
        const before=await readFile()
        await authorize?.(before.document)
        if (snapshot(before.document).revision!==revision) fail('setup_conflict')
        const next={...before.document,...parsed.data}
        await validate?.(next,before.document)
        const temporary=path.join(path.dirname(file),`.${path.basename(file)}.${randomBytes(12).toString('hex')}.tmp`)
        let handle
        try {
          handle=await fs.open(temporary,'wx',before.mode)
          await handle.writeFile(JSON.stringify(next,null,2)+'\n','utf8');await handle.sync();await handle.close();handle=null
          const current=await readFile()
          if (hash(current.raw)!==hash(before.raw)) fail('setup_conflict')
          await authorize?.(current.document)
          await fs.rename(temporary,file)
          // Update live readers only after the file has been replaced successfully.
          publish?.(next)
          return snapshot(next)
        } finally { await handle?.close().catch(()=>{});await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error}) }
      })))
    },
  }
}
module.exports={createFileSettings}
