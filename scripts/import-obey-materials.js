#!/usr/bin/env node
const fs = require('node:fs/promises')
const path = require('node:path')
const { createHash } = require('node:crypto')
const digest = buffer => createHash('sha256').update(buffer).digest('hex')
const destinations = ['discordVariant', 'thumbnailVariant', 'reducedMotionVariant', 'rendererVariant', 'rendererRasterVariant', 'webVariant', 'webDarkVariant', 'webLightVariant', 'webSelectedVariant', 'webDisabledVariant', 'previewFixtureVariant']

async function buildSelection(packageRoot) {
  const root = await fs.realpath(packageRoot)
  async function read(relative) {
    if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('Invalid material path')
    const filename = await fs.realpath(path.join(root, relative))
    if (!filename.startsWith(root + path.sep)) throw new Error('Material path escapes package')
    return fs.readFile(filename)
  }
  const catalog = JSON.parse(await read('10_ENTREGA_CODEX/assets-registry.json'))
  const materials = JSON.parse(await read('10_ENTREGA_CODEX/production-materials.json'))
  const upload = JSON.parse(await read('10_ENTREGA_CODEX/discord-upload-plan.json'))
  const aliasDocument = JSON.parse(await read('12_REVISION_VISUAL_Y_CODIGO/resource-aliases.json'))
  function index(entries) {
    const map = new Map()
    for (const entry of entries) {
      if (!/^[a-z][a-z0-9.-]+$/.test(entry.key) || map.has(entry.key)) throw new Error('Invalid or duplicate material key')
      map.set(entry.key, entry)
    }
    return map
  }
  const sources = index(catalog.assets), choices = index(materials.materials), uploads = index(upload.entries)
  if (sources.size !== choices.size) throw new Error('Material/catalog coverage differs')
  const assets = {}, files = new Map()
  for (const [key, material] of choices) {
    const source = sources.get(key)
    if (!source || source.kind !== material.kind) throw new Error(`Missing material source: ${key}`)
    const variants = new Map(source.files.map(file => [file.variant, file]))
    if (variants.size !== source.files.length) throw new Error(`Duplicate variant: ${key}`)
    const selectedFiles = {}, selectedDestinations = {}
    for (const destination of destinations) {
      const variant = material[destination]
      if (!variant) continue
      if (typeof variant !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(variant)) throw new Error(`Invalid material variant: ${key}`)
      selectedDestinations[destination] = variant
      if (Object.hasOwn(selectedFiles, variant)) continue
      const file = variants.get(variant)
      if (!file || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error(`Invalid selected variant: ${key}/${variant}`)
      const buffer = await read(file.path)
      if (buffer.length !== file.bytes || digest(buffer) !== file.sha256) throw new Error(`Material integrity mismatch: ${key}/${variant}`)
      const extension = path.extname(file.path).toLowerCase()
      if (!['.png', '.svg', '.gif'].includes(extension)) throw new Error(`Invalid material format: ${key}`)
      const target = `selected/${file.sha256}${extension}`
      files.set(target, buffer)
      selectedFiles[variant] = { ...file, sourcePath: file.path, path: target }
    }
    const plan = uploads.get(key)
    if (Boolean(plan) !== material.uploadAsEmoji) throw new Error(`Upload selection mismatch: ${key}`)
    if (plan) {
      const file = selectedFiles[plan.variant]
      if (!file || material.discordVariant !== plan.variant || plan.sourceSha256 !== file.sha256 ||
          !/^[a-z][a-z0-9_]{0,17}$/.test(plan.storageKey) || plan.name !== `obey_${plan.storageKey}_${file.sha256.slice(0, 8)}` ||
          plan.name.length > 32 || typeof plan.animated !== 'boolean' || plan.animated !== (path.extname(file.path) === '.gif')) throw new Error(`Upload integrity mismatch: ${key}`)
    }
    assets[key] = { kind: source.kind, fallback: source.fallback, fixtureOnly: Boolean(material.fixtureOnly || source.kind === 'card-template'), destinations: selectedDestinations, files: selectedFiles }
  }
  if ([...uploads.keys()].some(key => !choices.has(key)) || new Set(upload.entries.map(entry => entry.name)).size !== uploads.size) throw new Error('Invalid upload coverage or duplicate name')
  const aliases = {}
  for (const alias of aliasDocument.aliases) {
    if (!/^[a-z][a-z0-9_]*$/.test(alias.existingKey) || Object.hasOwn(aliases, alias.existingKey) || !Object.hasOwn(assets, alias.selectedKey)) throw new Error('Invalid or duplicate resource alias')
    aliases[alias.existingKey] = alias.selectedKey
  }
  const uploadPlan = upload.entries.map(({ key, storageKey, variant, animated, name, sourceSha256 }) => ({ key, storageKey, variant, animated, name, sha256: sourceSha256 }))
  return { selection: { version: 1, assets, aliases, uploadPlan }, files }
}

async function main() {
  const args = process.argv.slice(2)
  if (!args[0] || args.length > 2 || (args[1] && args[1] !== '--check')) throw new Error('Usage: node scripts/import-obey-materials.js <package-root> [--check]')
  const { selection, files } = await buildSelection(args[0])
  const root = path.resolve(__dirname, '../assets/obey')
  const registryFile = path.join(root, 'registry.json')
  if (args[1] === '--check') {
    const current = JSON.parse(await fs.readFile(registryFile, 'utf8'))
    if (JSON.stringify(current.selected) !== JSON.stringify(selection)) throw new Error('Imported selection differs from package')
    for (const [relative, buffer] of files) {
      if (digest(await fs.readFile(path.join(root, relative))) !== digest(buffer)) throw new Error(`Imported file integrity mismatch: ${relative}`)
    }
  } else {
    await fs.mkdir(path.join(root, 'selected'), { recursive: true })
    for (const [relative, buffer] of files) {
      const filename = path.join(root, relative)
      try { await fs.writeFile(filename, buffer, { flag: 'wx' }) }
      catch (error) { if (error.code !== 'EEXIST' || digest(await fs.readFile(filename)) !== digest(buffer)) throw error }
    }
    const current = JSON.parse(await fs.readFile(registryFile, 'utf8'))
    const temporary = `${registryFile}.${process.pid}.tmp`
    await fs.writeFile(temporary, JSON.stringify({ ...current, selected: selection }, null, 2) + '\n', { flag: 'wx' })
    await fs.rename(temporary, registryFile)
  }
  console.log(JSON.stringify({ mode: args[1] === '--check' ? 'check' : 'import', assets: Object.keys(selection.assets).length, aliases: Object.keys(selection.aliases).length, emojis: selection.uploadPlan.length, files: files.size }))
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { buildSelection }
