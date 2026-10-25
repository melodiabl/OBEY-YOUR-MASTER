const { PermissionFlagsBits } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')
const Moderation = require('../../../../database/schemas/ModerationSchema')
const { validId, visibleWarnings, HistoryError } = require('../domain/warnings')

async function historyRequest(client, work, timeoutMs = 15000) {
  let active = true, timer
  const context = { check() { if (!active || client._shuttingDown) throw new HistoryError('unavailable') } }
  try {
    return await Promise.race([
      Promise.resolve().then(() => work(context)),
      new Promise((_, reject) => { timer = setTimeout(() => { active = false; reject(new HistoryError('unavailable')) }, timeoutMs) }),
    ])
  } finally { active = false; clearTimeout(timer) }
}
async function access(client, guild, actorId, command, transport, context) {
  context.check()
  if (!guild || guild.available === false || !validId(guild.id) || !validId(actorId)) return 'unconfirmed'
  let actor
  try {
    await guild.roles.fetch()
    context.check()
    actor = await guild.members.fetch({ user: actorId, force: true })
  } catch (error) { context.check(); return error?.code === 10007 ? 'denied' : 'unconfirmed' }
  context.check()
  if (actor?.id !== actorId) return 'unconfirmed'
  try {
    return actor.permissions.has(PermissionFlagsBits.KickMembers)
      || transport === 'prefix' && prefixAllowed(client, guild, actor, command) ? 'allowed' : 'denied'
  } catch { return 'unconfirmed' }
}
async function requireAccess(client, guild, actorId, command, transport, context) {
  if (await access(client, guild, actorId, command, transport, context) !== 'allowed') throw new HistoryError('accessDenied')
}
function legacyRows(client, targetId, ids = client.userProfiles.get(targetId, 'warnings')) {
  if (client._dbReady !== true || client.userProfiles?._errors?.length) throw new HistoryError('unavailable')
  try { return visibleWarnings(ids, targetId, id => client.modActions.get(id)) }
  catch { throw new HistoryError('unavailable') }
}

async function warningRows(client, targetId, context, model = Moderation) {
  if (client._dbReady !== true) throw new HistoryError('unavailable')
  let old = []
  try { old = legacyRows(client, targetId) } catch { /* Legacy cache is optional; persisted cases remain readable. */ }
  const guildIds = [...client.guilds.cache.keys()]
  if (!guildIds.length) return old
  const query = { userId: targetId, guildId: { $in: guildIds }, action: 'warn', active: true }
  const count = await model.countDocuments(query)
  context.check()
  if (!Number.isSafeInteger(count) || count < 0 || count > 500) throw new HistoryError('unavailable')
  const cases = count ? await model.find(query)
    .sort({ createdAt: 1, _id: 1 }).limit(500).lean()
    : []
  context.check()
  const present = new Set(guildIds)
  if (!Array.isArray(cases) || cases.length !== count || cases.some(row => row.userId !== targetId || !present.has(row.guildId)
    || row.action !== 'warn' || row.active !== true)) throw new HistoryError('unavailable')
  return [...old, ...cases.map(row => ({ ...row, user: row.userId, guild: row.guildId, sourceKind: 'native' }))]
}

async function readLegacyHistory(client, guild, actorId, targetId, requested, command, context) {
  await requireAccess(client, guild, actorId, command, 'prefix', context)
  const raw = await warningRows(client, targetId, context), scopes = [guild]
  if (command === 'globalwarnings') {
    for (const id of new Set(raw.map(row => row.guild))) {
      if (id === guild.id) continue
      const foreign = client.guilds.cache.get(id)
      if (!foreign) continue
      const status = await access(client, foreign, actorId, command, 'prefix', context)
      if (status === 'unconfirmed') throw new HistoryError('unavailable')
      if (status === 'allowed') scopes.push(foreign)
    }
  }
  const permitted = new Set(scopes.map(scope => scope.id)), localIndexes = new Map()
  const rows = raw.filter(row => permitted.has(row.guild)).map(row => {
    const index = localIndexes.get(row.guild) || 0
    localIndexes.set(row.guild, index + 1)
    return { ...row, index }
  })
  const detail = command === 'detailwarn', perPage = detail ? 1 : 5
  if (detail && requested >= rows.length) throw new HistoryError('invalidPage')
  const page = detail ? requested + 1 : Math.min(requested, Math.max(1, Math.ceil(rows.length / perPage)))
  const selected = detail ? [rows[requested]] : rows.slice((page - 1) * perPage, page * perPage)
  await Promise.all(scopes.map(scope => requireAccess(client, scope, actorId, command, 'prefix', context)))
  return { selected, total: rows.length, page, perPage, detail, scopes }
}

async function readNativeHistory(client, model, guild, actorId, targetId, requested, context) {
  await requireAccess(client, guild, actorId, 'cases', 'slash', context)
  if (client._dbReady !== true) throw new HistoryError('unavailable')
  const query = { guildId: guild.id, userId: targetId }
  const total = await model.countDocuments(query)
  context.check()
  if (!Number.isSafeInteger(total) || total < 0) throw new HistoryError('unavailable')
  const perPage = 8, page = Math.min(requested, Math.max(1, Math.ceil(total / perPage)))
  const rows = total ? await model.find(query).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean() : []
  if (!Array.isArray(rows) || rows.length > perPage || total > 0 && rows.length === 0
    || rows.some(row => row.guildId !== guild.id || row.userId !== targetId)) throw new HistoryError('unavailable')
  await requireAccess(client, guild, actorId, 'cases', 'slash', context)
  return { rows, total, page, perPage }
}

module.exports = { legacyRows, warningRows, HistoryError, historyRequest, requireAccess, readLegacyHistory, readNativeHistory }
