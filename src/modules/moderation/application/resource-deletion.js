const { PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')
const config = require('../../../../botconfig/config.json')
const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)

function resourceId(message, args, kind) {
  const raw = args?.[0]
  if (raw === undefined) return kind === 'channel' ? message.channel?.id : null
  const match = String(raw).match(kind === 'role' ? /^(?:<@&(\d{17,20})>|(\d{17,20}))$/ : /^(?:<#(\d{17,20})>|(\d{17,20}))$/)
  return match?.[1] || match?.[2] || null
}

async function inspectResourceDeletion(client, message, targetId, kind) {
  const guild = message.guild, actorId = message.author?.id
  if (!['channel', 'role'].includes(kind) || !validId(targetId)) return { status: 'invalidTarget' }
  if (!validId(guild?.id) || !validId(actorId) || client._shuttingDown) return { status: 'unavailable' }
  let roles, actor, bot, target
  try {
    roles = await guild.roles.fetch()
    ;[actor, bot] = await Promise.all([
      guild.members.fetch({ user: actorId, force: true }), guild.members.fetchMe({ force: true }),
    ])
    target = kind === 'role' ? roles.get(targetId) : await guild.channels.fetch(targetId, { cache: false })
  } catch { return { status: 'unavailable' } }
  if (actor?.id !== actorId || bot?.id !== client.user?.id) return { status: 'unavailable' }
  if (target?.id !== targetId || target.guild?.id !== guild.id || typeof target.delete !== 'function')
    return { status: 'invalidTarget' }
  try {
    const allowed = kind === 'channel'
      ? actor.permissions.has(F.Administrator) || [guild.ownerId, config.ownerid].includes(actorId)
      : prefixAllowed(client, guild, actor, 'deleterole')
    if (!allowed) return { status: 'accessDenied' }
    if (kind === 'channel') {
      if (target.isThread?.()) return { status: 'threadTarget' }
      if (!target.permissionsFor(actor)?.has(F.ViewChannel)) return { status: 'accessDenied' }
      if (!target.permissionsFor(bot)?.has(F.ManageChannels)) return { status: 'botPermission' }
    } else {
      if (targetId === guild.id || target.managed) return { status: 'protectedRole' }
      if (!bot.permissions.has(F.ManageRoles)) return { status: 'botPermission' }
      if (!(bot.roles.highest.comparePositionTo(target) > 0) ||
          actorId !== guild.ownerId && !(actor.roles.highest.comparePositionTo(target) > 0))
        return { status: 'hierarchy' }
    }
  } catch { return { status: 'unavailable' } }
  return { status: 'ready', target, targetId, kind }
}

async function deleteResource(client, message, targetId, kind) {
  const access = await inspectResourceDeletion(client, message, targetId, kind)
  if (access.status !== 'ready') return access
  if (client._shuttingDown) return { status: 'unavailable' }
  let deleted
  try { deleted = await access.target.delete(`OBEY delete${kind} by ${message.author.id}`) }
  catch { return { status: 'unavailable' } }
  if (deleted?.id !== targetId) return { status: 'unconfirmed' }
  if (typeof client.logs?.emit === 'function') {
    try { await client.logs.emit({ guildId: message.guild.id, category: 'server', kind: `delete${kind}`,
      sourceChannelId: kind === 'channel' ? targetId : message.channel.id,
      actorId: message.author.id, origin: 'command',
      fields: [{ key: kind, value: targetId }] }) }
    catch { /* Deletion was confirmed; log delivery is separate. */ }
  }
  return { status: 'deleted', targetId, kind }
}

module.exports = { resourceId, inspectResourceDeletion, deleteResource }
