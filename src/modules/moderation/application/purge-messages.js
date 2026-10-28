const { PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const active = new Set()
const MAX_SCAN = 5000
const PAGE_SIZE = 100
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const AGE_MARGIN_MS = 60 * 1000
const filters = new Set(['all', 'bots', 'ownBot', 'links', 'attachments', 'user'])

function parseAmount(raw, maximum) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const value = String(raw)
  if (!/^[1-9]\d*$/.test(value)) return null
  const amount = Number(value)
  return Number.isSafeInteger(amount) && amount <= maximum ? amount : null
}

function matches(message, filter, userId, botId) {
  if (filter === 'user') return message.author?.id === userId
  if (filter === 'bots') return message.author?.bot === true
  if (filter === 'ownBot') return message.author?.id === botId
  if (filter === 'links') return /https?:\/\/\S+/i.test(message.content || '')
  if (filter === 'attachments') return (message.attachments?.size || 0) > 0
  return true
}

async function purgeMessages(client, input) {
  const { guild, channelId, actorId, policy, command, scanLimit, deleteLimit,
    filter = 'all', userId } = input
  if (!validId(guild?.id) || !validId(channelId) || !validId(actorId) ||
      !['prefix', 'slash'].includes(policy) || !filters.has(filter) ||
      policy === 'prefix' && !['clear', 'clearbotmessages'].includes(command) ||
      policy === 'slash' && command !== 'purge') return { status: 'invalidFilter' }
  if (!Number.isInteger(scanLimit) || scanLimit < 1 || scanLimit > MAX_SCAN ||
      !Number.isInteger(deleteLimit) || deleteLimit < 1 || deleteLimit > MAX_SCAN)
    return { status: 'invalidAmount' }
  if (filter === 'user' && !validId(userId)) return { status: 'invalidFilter' }
  if (client._shuttingDown) return { status: 'unavailable' }

  let actor, bot, channel
  try {
    await guild.roles.fetch()
    ;[actor, bot, channel] = await Promise.all([
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
      guild.channels.fetch(channelId, { cache: false }),
    ])
  } catch { return { status: 'unavailable' } }
  if (actor?.id !== actorId || bot?.id !== client.user?.id || channel?.id !== channelId ||
      channel.guild?.id !== guild.id || !channel.messages?.fetch || !channel.bulkDelete)
    return { status: 'unavailable' }

  let allowed, botAllowed
  try {
    allowed = policy === 'slash' ? actor.permissions.has(F.ManageMessages)
      : prefixAllowed(client, guild, actor, command)
    allowed &&= channel.permissionsFor(actor)?.has(F.ViewChannel) === true
    botAllowed = channel.permissionsFor(bot)?.has([F.ViewChannel, F.ReadMessageHistory, F.ManageMessages]) === true
  } catch { return { status: 'unavailable' } }
  if (!allowed) return { status: 'accessDenied' }
  if (!botAllowed) return { status: 'botPermission' }
  if (active.has(channelId)) return { status: 'busy' }
  active.add(channelId)

  let scanned = 0, deleted = 0, matched = 0, before, failed = false
  const cutoff = Date.now() - MAX_AGE_MS + AGE_MARGIN_MS
  try {
    while (scanned < scanLimit && deleted < deleteLimit && !client._shuttingDown) {
      const size = Math.min(PAGE_SIZE, scanLimit - scanned)
      let page
      try { page = await channel.messages.fetch({ limit: size, ...(before ? { before } : {}) }) }
      catch { failed = true; break }
      if (!page?.size) break
      const messages = [...page.values()]
      scanned += messages.length
      before = messages.at(-1)?.id
      const eligible = messages.filter(item => item.createdTimestamp >= cutoff &&
        matches(item, filter, userId, client.user.id)).slice(0, deleteLimit - deleted)
      matched += eligible.length
      for (let offset = 0; offset < eligible.length; offset += PAGE_SIZE) {
        try {
          const batch = eligible.slice(offset, offset + PAGE_SIZE)
          if (batch.length === 1) {
            await batch[0].delete()
            deleted++
          } else {
            const result = await channel.bulkDelete(batch, true)
            if (!Number.isInteger(result?.size)) { failed = true; break }
            deleted += result.size
          }
        } catch { failed = true; break }
      }
      if (failed || messages.length < size || messages.some(item => item.createdTimestamp < cutoff)) break
    }
  } finally { active.delete(channelId) }

  if (deleted && typeof client.logs?.emit === 'function') {
    try { await client.logs.emit({ guildId: guild.id, category: 'server', kind: 'purge',
      sourceChannelId: channelId, actorId, origin: policy,
      fields: [{ key: 'channel', value: `<#${channelId}>` },
        { key: 'deleted', value: String(deleted) }, { key: 'filter', value: filter }] }) }
    catch { /* Discord confirmed deletion; log delivery is separate. */ }
  }
  return { status: failed || client._shuttingDown ? deleted ? 'partial' : 'unavailable'
    : deleted ? 'deleted' : 'none', deleted, scanned, matched, channelId }
}

module.exports = { purgeMessages, parseAmount, matches, MAX_SCAN }
