const { createHash } = require('node:crypto')
const { BSON } = require('mongoose').mongo
const { requireSetupAccess } = require('./setup-access')
const { prefixSchema } = require('./prefix-settings')
const { replayMutations } = require('./sync-map-mutations')
const config = require('../botconfig/config.json'), embed = require('../botconfig/embed.json')
const modes = ['configuration', 'data']
class GlobalResetError extends Error { constructor(code) { super(code); this.code = code } }
function fail(code) { throw new GlobalResetError(code) }
function owner(client, actorId) { return /^\d{17,20}$/.test(actorId || '') && (client.config?.ownerIDS || config.ownerIDS || []).some(id => id === actorId) }
async function authorizeGlobalReset(client, context) {
  if (!owner(client, context.actorId)) fail('global_reset_owner')
  try {
    await requireSetupAccess(client, { ...context, authorizeActor: () => { if (!owner(client, context.actorId)) fail('global_reset_owner') } })
  } catch (error) {
    if (error instanceof GlobalResetError) throw error
    fail(['setup_unavailable', 'setup_denied', 'setup_channel_access', 'setup_bot_permissions'].includes(error.message) ? error.message : 'setup_unavailable')
  }
}
function targets(client, guildId, mode) {
  if (!/^\d{17,20}$/.test(guildId || '') || !modes.includes(mode)) fail('invalid_global_reset')
  const definitions = [['guild', 'settings', 'Guild', 'guildId'], ['jtc1', 'jtcsettings', 'JTC1', 'guildId'],
    ['jtc2', 'jtcsettings2', 'JTC2', 'guildId'], ['jtc3', 'jtcsettings3', 'JTC3', 'guildId'],
    ['roster', 'roster', 'Roster', 'guildId'], ['commands', 'customcommands', 'CustomCommand', 'guildId'],
    ['keywords', 'keyword', 'Keyword', 'guildId'], ['rankingSettings', 'points', 'Ranking', 'recordKey']]
  if (mode === 'data') definitions.push(['statistics', 'stats', 'Stats', 'guildId'], ['profiles', 'userProfiles', 'UserProfile', 'guildId'], ['rankingUsers', 'points', 'Ranking', 'recordKey'])
  return definitions.map(([id, name, modelName, key]) => {
    const store = client[name]
    if (store?.guildKey !== key || store.model?.modelName !== modelName || typeof store.replaceCached !== 'function' || typeof store.captureMutations !== 'function') fail('global_reset_store')
    const pattern = new RegExp(`^${guildId}-\\d{17,20}$`)
    return { id, store, filter: { [key]: id === 'rankingUsers' ? { $regex: pattern } : guildId },
      matches: value => id === 'rankingUsers' ? pattern.test(value) : value === guildId }
  })
}
function locked(entries, operation, captureWrites) {
  const stores = [...new Set(entries.map(e => e.store))], captures = new Map()
  const next = index => {
    if (index === stores.length) return operation(captures)
    const store = stores[index]
    // Install synchronously before reserving the queue slot, not when it eventually runs.
    const capture = captureWrites ? store.captureMutations(key => entries.some(e => e.store === store && e.matches(key))) : null
    if (capture) captures.set(store, capture)
    try { return store.exclusive(() => next(index + 1)).finally(() => capture?.close()) }
    catch (error) { capture?.close(); throw error }
  }
  return next(0)
}
async function snapshot(entries, session, guildId, mode) {
  const rows = []
  let bytes = 0
  for (const entry of entries) {
    const found = [], cursor = entry.store.model.find(entry.filter).sort({ _id: 1 }).limit(5001).batchSize(5001).setOptions({ promoteValues: false, promoteLongs: false }).session(session).lean().cursor()
    bytes += Buffer.byteLength(entry.id) + 16
    try {
      for await (const row of cursor) {
        bytes += BSON.serialize(row).length + 1
        if (found.length >= 5000 || bytes > 8 * 1024 * 1024) fail('global_reset_large')
        found.push(row)
      }
    } finally { await cursor.close().catch(() => {}) }
    rows.push(found)
  }
  const encoded = BSON.serialize({ guildId, mode, entries: entries.map((entry, i) => ({ id: entry.id, rows: rows[i] })) })
  if (encoded.length > 8 * 1024 * 1024) fail('global_reset_large')
  return { revision: createHash('sha256').update(encoded).digest('hex'), rows }
}
function connectionOf(entries) {
  const db = entries[0].store.model.db
  if (!db || typeof db.transaction !== 'function' || entries.some(e => e.store.model.db !== db)) fail('global_reset_store')
  return db
}
const transactionOptions = { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary', maxCommitTimeMS: 5000, timeoutMS: 15000 }
async function operation(client, context, mode, execute, captureWrites = false) {
  await authorizeGlobalReset(client, context)
  const entries = targets(client, context.guildId, mode), db = connectionOf(entries)
  try {
    return await locked(entries, async captures => {
      await authorizeGlobalReset(client, context)
      return execute(entries, db, captures)
    }, captureWrites)
  } catch (error) {
    if (error instanceof GlobalResetError) throw error
    fail(error.hasErrorLabel?.('UnknownTransactionCommitResult') ? 'global_reset_unconfirmed' : error.code === 11000 ? 'global_reset_conflict' : 'global_reset_storage')
  }
}
async function prepareGlobalReset(client, context, mode) {
  return operation(client, context, mode, async (entries, db) => {
    const result = await db.transaction(session => snapshot(entries, session, context.guildId, mode), transactionOptions)
    await authorizeGlobalReset(client, context)
    return { mode, revision: result.revision }
  })
}
async function confirmGlobalReset(client, context, prepared) {
  if (!prepared || !modes.includes(prepared.mode) || !/^[a-f0-9]{64}$/.test(prepared.revision || '')) fail('invalid_global_reset')
  return operation(client, context, prepared.mode, async (entries, db, captures) => {
    const result = await db.transaction(async session => {
      const before = await snapshot(entries, session, context.guildId, prepared.mode)
      if (before.revision !== prepared.revision) fail('global_reset_conflict')
      await authorizeGlobalReset(client, context)
      const prefix = client.config?.prefix || config.prefix
      if (!prefixSchema.safeParse(prefix).success) fail('invalid_global_reset')
      const baseline = { guildId: context.guildId, prefix, language: 'es', defaultVolume: 100, autoplay: false, defaultEqualizer: 'off', djroles: [], botchannel: [],
        embed: { color: embed.color, wrongcolor: embed.wrongcolor, thumb: false, footertext: 'OBEY YOUR MASTER', footericon: embed.footericon || '' } }
      if (prepared.mode === 'configuration' && before.rows[0][0]?.warns !== undefined) baseline.warns = before.rows[0][0].warns
      const guild = await entries[0].store.model.findOneAndReplace({ guildId: context.guildId }, baseline, { session, new: true, upsert: true }).lean()
      if (!guild) fail('global_reset_storage')
      for (const entry of entries.slice(1)) await entry.store.model.deleteMany(entry.filter).session(session)
      return { before, guild }
    }, transactionOptions)
    // No cache effect occurs inside the retriable callback or before commit.
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], mutations = captures.get(entry.store).mutations
      const keys = new Set([...entry.store.keyArray().filter(entry.matches), ...mutations.filter(m => entry.matches(m.key)).map(m => m.key), ...result.before.rows[i].map(row => row[entry.store.guildKey])])
      if (i === 0) keys.add(context.guildId)
      for (const key of keys) {
        const committed = i === 0 ? result.guild : null
        entry.store.replaceCached(key, replayMutations(committed, entry.store.guildKey, key, mutations))
      }
    }
    return { mode: prepared.mode, status: 'saved' }
  }, true)
}
module.exports = { authorizeGlobalReset, prepareGlobalReset, confirmGlobalReset }
