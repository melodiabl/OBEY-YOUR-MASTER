const { BSON } = require('mongoose').mongo
// Keep ordinary JS numbers ordinary, and retain explicit BSON types such as Long/Double.
function cloneMutation(value) {
  if (value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(cloneMutation)
  if (value instanceof Date) return new Date(value)
  if (Buffer.isBuffer(value)) return Buffer.from(value)
  if (value instanceof Map) return new Map([...value].map(([k, v]) => [k, cloneMutation(v)]))
  if ([Object.prototype, null].includes(Object.getPrototypeOf(value))) return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, cloneMutation(v)]))
  return BSON.deserialize(BSON.serialize({ value }), { promoteValues: false, promoteLongs: false }).value
}
function parent(doc, path, create) {
  const keys = path.split('.')
  if (keys.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) throw new Error('invalid_cache_path')
  const leaf = keys.pop()
  for (const key of keys) {
    if (doc[key] == null || typeof doc[key] !== 'object') { if (!create) return []; doc[key] = {} }
    doc = doc[key]
  }
  return [doc, leaf]
}
function replayMutations(committed, guildKey, key, mutations) {
  let result = cloneMutation(committed)
  for (const mutation of mutations.filter(value => value.key === key)) {
    if (mutation.deleted) { result = null; continue }
    if (!result && !mutation.upsert) continue
    const inserted = !result
    result ||= { [guildKey]: key }
    const update = cloneMutation(mutation.update)
    for (const [path, value] of Object.entries({ ...(inserted ? update.$setOnInsert : {}), ...update.$set })) {
      const [doc, leaf] = parent(result, path, true); doc[leaf] = value
    }
    for (const path of Object.keys(update.$unset || {})) { const [doc, leaf] = parent(result, path, false); if (doc) { if (Array.isArray(doc) && /^\d+$/.test(leaf)) doc[leaf] = null; else delete doc[leaf] } }
    for (const [path, value] of Object.entries(update.$push || {})) {
      const [doc, leaf] = parent(result, path, true)
      if (!Array.isArray(doc[leaf])) doc[leaf] = []
      doc[leaf].push(...value.$each)
    }
  }
  return result
}
module.exports = { cloneMutation, replayMutations }
