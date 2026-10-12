const SyncMap = require('../../handlers/sync-map')
const { isDeepStrictEqual } = require('node:util')
const readPath = (value, key) => key.split('.').reduce((current, part) => current?.[part], value)
function setPath(value, key, entry) {
  const parts = key.split('.'), last = parts.pop()
  let target = value
  for (const part of parts) target = target[part] ||= {}
  target[last] = structuredClone(entry)
}
function moduleSettingsFixture() {
  const records = new Map()
  let offline = false, writes = 0
  const model = {
    modelName: 'ModuleConfigurationFixture',
    findOne: ({ guildId }) => ({ lean: async () => structuredClone(records.get(guildId) || null) }),
    async findOneAndUpdate(filter, update) {
      if (offline) throw new Error('private database failure')
      const previous = records.get(filter.guildId) || { guildId: filter.guildId }
      for (const [key, condition] of Object.entries(filter)) {
        if (key === 'guildId') continue
        const actual = readPath(previous, key)
        if (condition.$exists === false && actual !== undefined) return null
        if (Object.hasOwn(condition, '$eq') && !isDeepStrictEqual(actual, condition.$eq)) return null
      }
      const next = structuredClone(previous)
      for (const [key, value] of Object.entries(update.$set || {})) setPath(next, key, value)
      for (const [key, value] of Object.entries(update.$inc || {})) setPath(next, key, (readPath(previous, key) || 0) + value)
      records.set(filter.guildId, next)
      writes++
      return structuredClone(next)
    },
  }
  return { records, model, store: new SyncMap(model), writes: () => writes, setOffline: value => { offline = value } }
}
module.exports = { moduleSettingsFixture }
