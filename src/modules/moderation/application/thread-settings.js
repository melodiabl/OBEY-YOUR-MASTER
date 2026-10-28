const { PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const durations = new Set([60, 1440, 4320, 10080])
const operations = {
  archivethread: { method: 'setArchived', field: 'archived', value: true },
  unarchivethread: { method: 'setArchived', field: 'archived', value: false },
  lockthread: { method: 'setLocked', field: 'locked', value: true },
  unlockthread: { method: 'setLocked', field: 'locked', value: false },
  setautoarchiveduration: { method: 'setAutoArchiveDuration', field: 'autoArchiveDuration' },
}

function parseDuration(value) {
  if (typeof value !== 'string' || !/^(?:60|1440|4320|10080)$/.test(value)) return null
  const minutes = Number(value)
  return durations.has(minutes) ? minutes : null
}

function threadIdFor(message, args, command) {
  const mention = message.mentions?.channels?.first?.()
  if (mention) return mention.id
  const raw = args[command === 'setautoarchiveduration' ? 1 : 0]
  if (raw === undefined) return message.channel?.id
  const match = String(raw).match(/^(?:<#(\d{17,20})>|(\d{17,20}))$/)
  return match?.[1] || match?.[2] || null
}

async function changeThreadSettings(client, message, args, command) {
  const op = operations[command]
  if (!op || !validId(message.guild?.id) || !validId(message.author?.id) || client._shuttingDown)
    return { status: 'unavailable' }
  const guild = message.guild
  const value = command === 'setautoarchiveduration' ? parseDuration(args[0]) : op.value
  if (value === null) return { status: 'invalidDuration' }
  const threadId = threadIdFor(message, args, command)
  if (!validId(threadId)) return { status: 'invalidThread' }

  let thread, actor, bot
  try {
    await guild.roles.fetch()
    ;[thread, actor, bot] = await Promise.all([
      guild.channels.fetch(threadId, { cache: false }),
      guild.members.fetch({ user: message.author.id, force: true }),
      guild.members.fetchMe({ force: true }),
    ])
  } catch { return { status: 'unavailable' } }
  if (!thread || thread.id !== threadId || thread.guild?.id !== guild.id ||
      !thread.isThread?.() || typeof thread[op.method] !== 'function') return { status: 'invalidThread' }
  if (actor?.id !== message.author.id || bot?.id !== client.user?.id) return { status: 'unavailable' }

  let allowed, botAllowed
  try {
    allowed = prefixAllowed(client, guild, actor, command)
    botAllowed = thread.permissionsFor?.(bot)?.has(F.ManageThreads)
  } catch { return { status: 'unavailable' } }
  if (!allowed) return { status: 'accessDenied' }
  if (!botAllowed) return { status: 'botPermission' }
  if (thread[op.field] === value) return { status: 'unchanged', threadId, value }
  if (thread.archived && command !== 'unarchivethread') return { status: 'archivedThread' }
  if (client._shuttingDown) return { status: 'unavailable' }

  const previous = thread[op.field]
  let updated
  try { updated = await thread[op.method](value, `OBEY ${command} by ${message.author.id}`) }
  catch { return { status: 'unavailable' } }
  if (updated?.id !== threadId || updated[op.field] !== value) return { status: 'unconfirmed' }

  if (typeof client.logs?.emit === 'function') {
    try { await client.logs.emit({ guildId: guild.id, category: 'server', kind: command,
      sourceChannelId: threadId, actorId: message.author.id, origin: 'command',
      fields: [{ key: 'channel', value: `<#${threadId}>` },
        { key: 'before', value: String(previous) }, { key: 'after', value: String(value) }] }) }
    catch { /* Discord confirmed the change; log delivery is tracked separately. */ }
  }
  return { status: 'changed', threadId, value, command }
}

module.exports = { changeThreadSettings, parseDuration, threadIdFor, operations }
