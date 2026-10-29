const fs = require('node:fs')
const path = require('node:path')
const { z } = require('zod')
const { prefixSchema } = require('./prefix-settings')
const { statusSchema } = require('./bot-status-contract')
const { ActivityType } = require('discord.js')
const activityTypes = new Map([['PLAYING', ActivityType.Playing], ['STREAMING', ActivityType.Streaming],
  ['LISTENING', ActivityType.Listening], ['WATCHING', ActivityType.Watching], ['COMPETING', ActivityType.Competing]])
const schemas = {
  'config.json': z.strictObject({ prefix: prefixSchema,
    ownerIDS: z.array(z.string().regex(/^\d{17,20}$/)).min(1).max(100).refine(ids => new Set(ids).size === ids.length),
    ownerGuildNotifications: z.boolean().optional(), ownerNotificationsLanguage: z.enum(['es', 'en']).optional() }),
  'advertisement.json': z.strictObject({ adenabled: z.boolean() }),
  'status.json': z.strictObject({ status: statusSchema }),
}
const keys = { 'config.json': ['prefix', 'ownerIDS', 'ownerGuildNotifications', 'ownerNotificationsLanguage'], 'advertisement.json': ['adenabled'], 'status.json': ['status'] }
const unavailable = () => Object.assign(new Error('global_configuration_unavailable'), { code: 'global_configuration_unavailable' })

function globalConfigurationFile(name, { directory = process.env.OBEY_GLOBAL_CONFIG_DIR } = {}) {
  if (!Object.hasOwn(schemas, name) || (directory !== undefined && (typeof directory !== 'string' || !path.isAbsolute(directory)))) throw unavailable()
  return path.join(directory === undefined ? path.join(__dirname, '../botconfig') : directory, directory === undefined && name === 'status.json' ? 'config.json' : name)
}

// Migration/backup projection: persist only fields owned by the migrated editors.
function projectGlobalConfiguration(documents) {
  try {
    return Object.fromEntries(Object.entries(keys).map(([name, fields]) => [name, schemas[name].parse(
      Object.fromEntries(fields.filter(key => Object.hasOwn(documents[name] || documents['config.json'], key)).map(key => [key, (documents[name] || documents['config.json'])[key]])))]))
  } catch { throw unavailable() }
}

function readGlobalConfiguration(directory, { allowMissingStatus = false } = {}) {
  try {
    if (!directory || !path.isAbsolute(directory)) throw unavailable()
    const stat = fs.lstatSync(directory)
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw unavailable()
    return Object.fromEntries(Object.entries(schemas).flatMap(([name, schema]) => {
      if (name === 'status.json' && allowMissingStatus && !fs.existsSync(globalConfigurationFile(name, { directory }))) return []
      const fd = fs.openSync(globalConfigurationFile(name, { directory }), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK)
      try {
        const file = fs.fstatSync(fd)
        if (!file.isFile() || file.size > 65536) throw unavailable()
        return [[name, schema.parse(JSON.parse(fs.readFileSync(fd, 'utf8')))]]
      } finally { fs.closeSync(fd) }
    }))
  } catch { throw unavailable() }
}

function initializeGlobalConfiguration({ directory = process.env.OBEY_GLOBAL_CONFIG_DIR } = {}) {
  if (directory === undefined) return false
  // Validate all documents before changing either shared require() object.
  const documents = readGlobalConfiguration(directory)
  for (const [name, document] of Object.entries(documents)) Object.assign(require(path.join(__dirname, '../botconfig', name === 'status.json' ? 'config.json' : name)), document)
  return true
}

function advertisementRuntimeSettings(overrides = {}) {
  const current = { ...require('../botconfig/advertisement.json'), ...overrides }
  const activity = current.statusad
  const statusad = activity && typeof activity === 'object' ? { ...activity,
    type: activityTypes.get(activity.type) ?? ([...activityTypes.values()].includes(activity.type) ? activity.type : ActivityType.Playing) } : null
  return { enabled: current.adenabled, statusad, spacedot: current.spacedot ?? ' • ', textad: current.textad ?? '' }
}

module.exports = { globalConfigurationFile, projectGlobalConfiguration, readGlobalConfiguration, initializeGlobalConfiguration, advertisementRuntimeSettings }
