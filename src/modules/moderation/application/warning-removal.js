const { prefixAllowed } = require('../../../../handlers/moderation/member-access')
const { legacyRows, warningRows, HistoryError, requireAccess } = require('./history')
const { removeReferences } = require('../infrastructure/legacy-warning-store')
const Moderation = require('../../../../database/schemas/ModerationSchema')

async function requireRemovalAccess(client, guild, actorId, targetId, command, context) {
  context.check()
  await guild.roles.fetch()
  context.check()
  const [actor, target] = await Promise.all([
    guild.members.fetch({ user: actorId, force: true }),
    guild.members.fetch({ user: targetId, force: true }),
  ])
  context.check()
  if (actor?.id !== actorId || target?.id !== targetId || target.guild?.id !== guild.id
    || !prefixAllowed(client, guild, actor, command)) throw new HistoryError('accessDenied')
  const order = target.roles.highest.comparePositionTo(actor.roles.highest)
  if (!Number.isFinite(order) || order >= 0) throw new HistoryError('accessDenied')
}

async function removePrefixWarnings(client, guild, actorId, targetId, index, command, context) {
  if (!['unwarn', 'removeallwarns'].includes(command)) throw new HistoryError('accessDenied')
  await requireRemovalAccess(client, guild, actorId, targetId, command, context)
  if (client._dbReady !== true) throw new HistoryError('unavailable')
  const rows = (await warningRows(client, targetId, context)).filter(row => row.guild === guild.id)
  const selected = index === null ? rows : rows[index] ? [rows[index]] : []
  if (!selected.length) throw new HistoryError('invalidPage')
  const native = selected.filter(row => row.sourceKind === 'native')
  const old = selected.filter(row => row.sourceKind !== 'native')
  await requireRemovalAccess(client, guild, actorId, targetId, command, context)
  let nativeChanged = false
  if (native.length) {
    context.check()
    const result = await Moderation.updateMany(
      { _id: { $in: native.map(row => row._id) }, guildId: guild.id, userId: targetId, action: 'warn', active: true },
      { $set: { active: false, removedBy: actorId, removedAt: new Date() } },
    )
    if (!result?.acknowledged) throw new HistoryError('unavailable')
    nativeChanged = result.matchedCount > 0
    if (result.matchedCount !== native.length) throw new HistoryError(nativeChanged ? 'partial' : 'changed')
  }
  if (old.length) {
    try {
      await removeReferences(client, targetId, ids => {
        const visible = legacyRows(client, targetId, ids).filter(row => row.guild === guild.id)
        const refs = new Set(old.map(row => String(row.sourceId)))
        const matching = visible.filter(row => refs.has(String(row.sourceId)))
        if (matching.length !== old.length) throw new HistoryError('changed')
        return matching.map(row => row.sourceId)
      }, () => requireRemovalAccess(client, guild, actorId, targetId, command, context), context)
    } catch (error) { if (nativeChanged) throw new HistoryError('partial'); throw error }
  }
}

async function removeCase(client, guild, actorId, caseId, reason, model, context) {
  await requireAccess(client, guild, actorId, 'unwarn', 'slash', context)
  if (client._dbReady !== true) throw new HistoryError('unavailable')
  const entry = await model.findOne({ guildId: guild.id, caseId }).lean()
  context.check()
  if (!entry || entry.guildId !== guild.id || entry.caseId !== caseId || entry.action !== 'warn') throw new HistoryError('invalidPage')
  if (entry.active !== true) throw new HistoryError('inactive')
  await requireAccess(client, guild, actorId, 'unwarn', 'slash', context)
  context.check()
  const result = await model.updateOne(
    { _id: entry._id, guildId: guild.id, userId: entry.userId, caseId, action: 'warn', active: true },
    { $set: { active: false, removedBy: actorId, removedAt: new Date(), removalReason: reason } },
  )
  if (!result?.acknowledged) throw new HistoryError('unavailable')
  if (result.matchedCount !== 1) throw new HistoryError('changed')
}

module.exports = { removePrefixWarnings, removeCase }
