const { PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)

function parseSeconds(value, transport) {
  if (transport === 'prefix') {
    if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,4})$/.test(value)) return null
    value = Number(value)
  }
  return Number.isInteger(value) && value >= 0 && value <= 21600 ? value : null
}

async function changeSlowmode(client, { guild, actorId, channelId, seconds, transport }) {
  const value = parseSeconds(seconds, transport)
  if (value === null) return { status: 'invalidSeconds' }
  if (!validId(guild?.id) || !validId(actorId) || !validId(channelId) ||
      !['prefix', 'slash'].includes(transport) || client._shuttingDown) return { status: 'unavailable' }

  let channel, actor, bot
  try {
    await guild.roles.fetch()
    ;[channel, actor, bot] = await Promise.all([
      guild.channels.fetch(channelId, { cache: false }),
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
    ])
  } catch { return { status: 'unavailable' } }
  if (!channel || channel.id !== channelId || channel.guild?.id !== guild.id ||
      typeof channel.setRateLimitPerUser !== 'function') return { status: 'invalidChannel' }
  if (actor?.id !== actorId || bot?.id !== client.user?.id) return { status: 'unavailable' }

  let allowed
  try {
    allowed = transport === 'prefix' ? prefixAllowed(client, guild, actor, 'slowmode')
      : actor.permissions.has(F.ManageChannels) && channel.permissionsFor(actor)?.has(F.ManageChannels)
  } catch { return { status: 'unavailable' } }
  if (!allowed) return { status: 'accessDenied' }
  let botAllowed
  try { botAllowed = channel.permissionsFor?.(bot)?.has(F.ManageChannels) }
  catch { return { status: 'unavailable' } }
  if (!botAllowed) return { status: 'botPermission' }
  if (Number(channel.rateLimitPerUser ?? 0) === value) return { status: 'unchanged', channelId, seconds: value }
  if (client._shuttingDown) return { status: 'unavailable' }

  const before = Number(channel.rateLimitPerUser ?? 0)
  let updated
  try { updated = await channel.setRateLimitPerUser(value, `OBEY slowmode by ${actorId}`) }
  catch { return { status: 'unavailable' } }
  if (updated?.id !== channelId || Number(updated.rateLimitPerUser ?? 0) !== value)
    return { status: 'unconfirmed' }

  if (typeof client.logs?.emit === 'function') {
    try { await client.logs.emit({ guildId: guild.id, category: 'server', kind: 'slowmodeChanged',
      sourceChannelId: channelId, actorId, origin: 'command',
      fields: [{ key: 'channel', value: `<#${channelId}>` },
        { key: 'before', value: String(before) }, { key: 'after', value: String(value) }] }) }
    catch { /* The Discord change succeeded; log delivery is tracked separately. */ }
  }
  return { status: value === 0 ? 'disabled' : 'enabled', channelId, seconds: value }
}

module.exports = { changeSlowmode, parseSeconds }
