const Moderation = require('../../../../database/schemas/ModerationSchema')
const { nextCaseId } = require('../../../../handlers/moderation/cases')
const { validId, HistoryError } = require('../domain/warnings')
const { PermissionFlagsBits } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

async function requireManualWarningAccess(client, guild, actorId, targetId, transport) {
  if (!validId(guild?.id) || !validId(actorId) || !validId(targetId) || actorId === targetId
    || targetId === guild.ownerId || targetId === client.user.id || client._shuttingDown) throw new HistoryError('accessDenied')
  await guild.roles.fetch()
  const [actor, target] = await Promise.all([
    guild.members.fetch({ user: actorId, force: true }),
    guild.members.fetch({ user: targetId, force: true }),
  ])
  if (client._shuttingDown || actor?.id !== actorId || target?.id !== targetId || target.guild?.id !== guild.id
    || target.user?.bot || !(transport === 'prefix' ? prefixAllowed(client, guild, actor, 'warn')
      : actor.permissions.has(PermissionFlagsBits.KickMembers))) throw new HistoryError('accessDenied')
  if (actorId !== guild.ownerId) {
    const order = target.roles?.highest?.comparePositionTo(actor.roles?.highest)
    if (!Number.isFinite(order) || order >= 0) throw new HistoryError('accessDenied')
  }
}

async function createWarning(client, { guildId, userId, moderatorId, reason, origin = 'slash' }, dependencies = {}) {
  if (client._dbReady !== true || client._shuttingDown) throw new HistoryError('unavailable')
  if (![guildId, userId, moderatorId].every(validId) || typeof reason !== 'string' || !reason.trim()) throw new HistoryError('invalidTarget')
  if (!['prefix', 'auto', 'slash'].includes(origin)) throw new HistoryError('invalidTarget')
  const model = dependencies.model || Moderation, allocate = dependencies.allocate || nextCaseId
  if (dependencies.authorize) await dependencies.authorize()
  const caseId = await allocate(guildId)
  if (dependencies.authorize) await dependencies.authorize()
  if (client._shuttingDown) throw new HistoryError('unavailable')
  const entry = await model.create({
    guildId, userId, moderatorId, action: 'warn', reason: reason.slice(0, 1000).toWellFormed(),
    caseId, active: true, warningOrigin: origin,
  })
  if (!entry || entry.guildId !== guildId || entry.userId !== userId || entry.caseId !== caseId) throw new HistoryError('unavailable')
  let count = null, globalCount = null, escalationCount = null
  try {
    count = await model.countDocuments({ guildId, userId, action: 'warn', active: true })
    globalCount = await model.countDocuments({ userId, action: 'warn', active: true })
    escalationCount = await model.countDocuments({ guildId, userId, action: 'warn', active: true, warningOrigin: { $in: ['prefix', 'auto'] } })
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(globalCount) || globalCount < count) {
      count = null; globalCount = null; escalationCount = null
    }
    if (!Number.isSafeInteger(escalationCount) || escalationCount < 0 || escalationCount > count) escalationCount = null
  } catch { count = null; globalCount = null; escalationCount = null }
  return { caseId, count, globalCount, escalationCount }
}

module.exports = { createWarning, requireManualWarningAccess }
