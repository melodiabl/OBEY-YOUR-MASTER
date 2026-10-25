const { PermissionFlagsBits } = require('discord.js')
const config = require('../../botconfig/config.json')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const prefixCommands = new Set(['ban', 'idban', 'useridban'])

function prefixAllowed(client, guild, actor, command) {
  const key = command === 'idban' ? 'ban' : command
  const adminRoles = client.settings.get(guild.id, 'adminroles') || []
  const commandRoles = client.settings.get(guild.id, `cmdadminroles.${key}`) || []
  return actor.permissions.has(PermissionFlagsBits.Administrator)
    || [guild.ownerId, config.ownerid].includes(actor.id)
    || commandRoles.includes(actor.id)
    || actor.roles.cache.some(role => commandRoles.includes(role.id) || adminRoles.includes(role.id))
}

// Owns the Discord effect; each transport keeps its existing history/notification policy.
async function performBan(client, { guild, actorId, targetId, reason, days = 0, policy, command }) {
  if (!validId(targetId)) return { status: 'invalidUserId' }
  if (!validId(guild?.id) || !validId(actorId) || !['prefix', 'slash'].includes(policy)
    || policy === 'prefix' && !prefixCommands.has(command)) return { status: 'permission' }
  if (!Number.isInteger(days) || days < 0 || days > 7) return { status: 'invalidDeleteDays' }
  if (client._shuttingDown) return { status: 'stopping' }
  if ([actorId, client.user.id, guild.ownerId].includes(targetId)) return { status: 'protectedTarget' }

  let results
  try {
    await guild.roles.fetch()
    results = await Promise.allSettled([
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
      guild.members.fetch({ user: targetId, force: true }),
    ])
  } catch { return { status: 'accessUnconfirmed' } }
  if (results[0].status !== 'fulfilled' || results[1].status !== 'fulfilled') return { status: 'accessUnconfirmed' }
  const actor = results[0].value, bot = results[1].value
  if (actor?.id !== actorId) return { status: 'accessUnconfirmed' }
  let allowed
  try { allowed = policy === 'slash' ? actor.permissions.has(PermissionFlagsBits.BanMembers) : prefixAllowed(client, guild, actor, command) }
  catch { return { status: 'accessUnconfirmed' } }
  if (!allowed) return { status: 'permission' }
  if (!bot?.permissions?.has(PermissionFlagsBits.BanMembers)) return { status: 'botPermission' }

  const targetResult = results[2]
  if (targetResult.status === 'rejected' && targetResult.reason?.code !== 10007) return { status: 'targetLookupFailed' }
  const member = targetResult.status === 'fulfilled' ? targetResult.value : null
  if (targetResult.status === 'fulfilled' && !member) return { status: 'targetLookupFailed' }
  if (!member && policy === 'prefix' && command === 'ban') return { status: 'missingMember' }
  if (member) {
    if (member.id !== targetId || member.guild.id !== guild.id || !member.bannable) return { status: 'hierarchy' }
    if (!(policy === 'slash' && actorId === guild.ownerId)) {
      const actorRole = actor.roles?.highest, targetRole = member.roles?.highest
      if (!actorRole || typeof targetRole?.comparePositionTo !== 'function') return { status: 'hierarchy' }
      let order
      try { order = targetRole.comparePositionTo(actorRole) } catch { return { status: 'hierarchy' } }
      if (!Number.isFinite(order) || order >= 0) return { status: 'hierarchy' }
    }
  }
  if (client._shuttingDown) return { status: 'stopping' }
  const boundedReason = typeof reason === 'string' ? reason.slice(0, 512).toWellFormed() : ''
  try { await guild.members.ban(targetId, { reason: boundedReason, deleteMessageSeconds: days * 86400 }) }
  catch { return { status: 'actionFailed' } }
  return { status: 'banned', targetId, reason: boundedReason, user: member?.user }
}

module.exports = { performBan }
