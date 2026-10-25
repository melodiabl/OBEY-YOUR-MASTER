const { checkMemberAccess } = require('./member-access')

// Each transport keeps its existing history and notification policy.
async function performBan(client, { guild, actorId, targetId, reason, days = 0, policy, command }) {
  if (!Number.isInteger(days) || days < 0 || days > 7) return { status: 'invalidDeleteDays' }
  const access = await checkMemberAccess(client, { guild, actorId, targetId, policy, command, action: 'ban' })
  if (access.status !== 'allowed') return access
  const boundedReason = typeof reason === 'string' ? reason.slice(0, 512).toWellFormed() : ''
  try { await guild.members.ban(targetId, { reason: boundedReason, deleteMessageSeconds: days * 86400 }) }
  catch { return { status: 'actionFailed' } }
  return { status: 'banned', targetId, reason: boundedReason, user: access.member?.user }
}

module.exports = { performBan }
