const path = require('node:path')
const catalog = require('../../assets/obey/production/catalog.json')
const root = path.resolve(__dirname, '../../assets/obey/production')
function entryFor(key) {
  const canonical = Object.hasOwn(catalog.entries, key) ? key : Object.hasOwn(catalog.aliases, key) ? catalog.aliases[key] : null
  return canonical ? { key: canonical, ...catalog.entries[canonical] } : null
}
function assetFor(key) {
  const entry = entryFor(key)
  if (!entry) throw new Error(`Unknown production asset: ${key}`)
  const file = path.resolve(root, entry.file)
  if (!file.startsWith(root + path.sep)) throw new Error('Production path escapes registry')
  return { ...entry, path: file }
}
function createProductionRegistry(map = {}, applicationId) {
  return require('./registry').createRegistry(map, applicationId)
}

module.exports = { catalog, entryFor, assetFor, createProductionRegistry }
