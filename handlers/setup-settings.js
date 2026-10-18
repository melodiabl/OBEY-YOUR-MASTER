const { createHash } = require('node:crypto')
const { z } = require('zod')

class SetupSettingsError extends Error {
  constructor(code, fields = []) { super(code); this.code = code; this.fields = fields }
}
const fail = (code, fields) => { throw new SetupSettingsError(code, fields) }
function lookup(doc, path) {
  let value = doc
  for (const key of path.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return { present: false }
    value = value[key]
  }
  return { present: true, value }
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Definitions own the paths and validators; requests can only select declared IDs.
function createSetupSettings(store, fields, isStopping = () => false) {
  const ids = Object.keys(fields), roots = [...new Set(ids.map(id => fields[id].path.split('.')[0]))].sort()
  if (!ids.length || ids.some(id => !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id) || !/^[a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z][a-zA-Z0-9_-]*)*$/.test(fields[id].path) || fields[id].path.split('.').some(key => ['constructor', 'prototype', '__proto__'].includes(key)))) throw new Error('invalid_setup_definition')
  const patchSchema = z.strictObject(Object.fromEntries(ids.map(id => [id, fields[id].schema]))).partial()
    .refine(value => Object.keys(value).length > 0 && Object.values(value).every(item => item !== undefined))
  function check(guildId) {
    if (isStopping()) fail('setup_unavailable')
    if (typeof guildId !== 'string' || !/^[a-zA-Z0-9_:-]{1,100}$/.test(guildId)) fail('invalid_setup')
  }
  function snapshot(doc = {}) {
    return { values: Object.fromEntries(ids.map(id => {
      const found = lookup(doc, fields[id].path)
      return [id, structuredClone(found.present ? found.value : fields[id].default)]
    })), revision: createHash('sha256').update(JSON.stringify(roots.map(root => [root, lookup(doc, root)]))).digest('hex') }
  }
  const stored = guildId => store.model.findOne({ [store.guildKey]: guildId }).lean()
  function cached(guildId) { return Object.fromEntries(ids.map(id => [id, structuredClone(store.get(guildId, fields[id].path))])) }
  function publish(guildId, doc, before) {
    if (!doc) return
    const patch = {}
    for (const id of ids) {
      const found = lookup(doc, fields[id].path)
      if (found.present && equal(store.get(guildId, fields[id].path), before[id])) patch[fields[id].path] = found.value
    }
    if (Object.keys(patch).length) store.patchCached(guildId, patch)
  }
  async function storage(operation) {
    try { return await operation() }
    catch (error) {
      if (error instanceof SetupSettingsError) throw error
      fail(error?.code === 11000 ? 'setup_conflict' : 'setup_storage')
    }
  }
  return {
    read(guildId) {
      check(guildId)
      return storage(() => store.exclusive(async () => {
        const before = cached(guildId), doc = await stored(guildId)
        publish(guildId, doc, before)
        return snapshot(doc || {})
      }))
    },
    save(guildId, input, expectedRevision) {
      check(guildId)
      const parsed = patchSchema.safeParse(input)
      if (!parsed.success) fail('invalid_setup', [...new Set(parsed.error.issues.map(issue => issue.path[0]).filter(value => typeof value === 'string'))])
      if (typeof expectedRevision !== 'string' || !/^[a-f0-9]{64}$/.test(expectedRevision)) fail('invalid_setup')
      // Synchronous admission to the shared queue makes accepted writes part of flush.
      return storage(() => store.exclusive(async () => {
        const before = cached(guildId), doc = await stored(guildId), current = snapshot(doc || {})
        if (current.revision !== expectedRevision) fail('setup_conflict')
        const changes = Object.fromEntries(Object.entries(parsed.data).filter(([id, value]) => !equal(value, current.values[id])).map(([id, value]) => [fields[id].path, value]))
        if (!Object.keys(changes).length) { publish(guildId, doc, before); return current }
        const filter = { [store.guildKey]: guildId }
        for (const root of roots) { const found = lookup(doc || {}, root); filter[root] = found.present ? { $eq: found.value } : { $exists: false } }
        const saved = await store.model.findOneAndUpdate(filter, { $set: changes }, { new: true, upsert: !doc, setDefaultsOnInsert: false }).lean()
        if (!saved) fail('setup_conflict')
        publish(guildId, saved, before)
        return snapshot(saved)
      }))
    },
  }
}

module.exports = { SetupSettingsError, createSetupSettings }
