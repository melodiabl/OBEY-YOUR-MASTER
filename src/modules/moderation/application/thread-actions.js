const { PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const BULK_LIMIT = 20

function selectedThreadId(message, args) {
  const mention = message.mentions?.channels?.first?.()
  if (mention) return mention.id
  const raw = args?.[0]
  if (raw === undefined) return message.channel?.id
  const match = String(raw).match(/^(?:<#(\d{17,20})>|(\d{17,20}))$/)
  return match?.[1] || match?.[2] || null
}

async function access(client, message, command) {
  const guild = message.guild
  if (!validId(guild?.id) || !validId(message.author?.id) || client._shuttingDown)
    return { status: 'unavailable' }
  let actor, bot
  try {
    await guild.roles.fetch()
    ;[actor, bot] = await Promise.all([
      guild.members.fetch({ user: message.author.id, force: true }),
      guild.members.fetchMe({ force: true }),
    ])
  } catch { return { status: 'unavailable' } }
  if (actor?.id !== message.author.id || bot?.id !== client.user?.id)
    return { status: 'unavailable' }
  try {
    const allowed = command === 'deletethread'
      ? actor.permissions.has(F.Administrator) || actor.id === guild.ownerId || actor.id === require('../../../../botconfig/config.json').ownerid
      : prefixAllowed(client, guild, actor, command)
    if (!allowed) return { status: 'accessDenied' }
  } catch { return { status: 'unavailable' } }
  return { status: 'allowed', actor, bot }
}

async function threadFor(guild, id) {
  if (!validId(id)) return null
  const thread = await guild.channels.fetch(id, { cache: false })
  return thread?.id === id && thread.guild?.id === guild.id && thread.isThread?.() ? thread : null
}

async function logConfirmed(client, message, command, thread) {
  if (typeof client.logs?.emit !== 'function') return
  try {
    await client.logs.emit({ guildId: message.guild.id, category: 'server', kind: command,
      sourceChannelId: thread.id, actorId: message.author.id, origin: 'command',
      fields: [{ key: 'channel', value: `<#${thread.id}>` }] })
  } catch { /* Discord confirmed the action; log delivery is separate. */ }
}

async function changeThreadMembership(client, message, args, command) {
  if (!['jointhread', 'leavethread'].includes(command)) return { status: 'unavailable' }
  const id = selectedThreadId(message, args)
  if (!validId(id)) return { status: 'invalidThread' }
  const auth = await access(client, message, command)
  if (auth.status !== 'allowed') return auth
  let thread
  try { thread = await threadFor(message.guild, id) }
  catch { return { status: 'unavailable' } }
  if (!thread) return { status: 'invalidThread' }
  if (thread.archived) return { status: 'archivedThread' }
  try {
    if (!thread.permissionsFor(auth.actor)?.has(F.ViewChannel)) return { status: 'accessDenied' }
    if (!thread.permissionsFor(auth.bot)?.has(F.ViewChannel)) return { status: 'botPermission' }
  } catch { return { status: 'unavailable' } }
  if (client._shuttingDown) return { status: 'unavailable' }
  let updated
  try { updated = await thread[command === 'jointhread' ? 'join' : 'leave']() }
  catch { return { status: 'unavailable' } }
  if (updated?.id !== id) return { status: 'unconfirmed' }
  await logConfirmed(client, message, command, thread)
  return { status: command === 'jointhread' ? 'joined' : 'left', threadId: id }
}

async function joinActiveThreads(client, message) {
  const auth = await access(client, message, 'jointhreads')
  if (auth.status !== 'allowed') return auth
  let active
  try { active = await message.guild.channels.fetchActiveThreads(false) }
  catch { return { status: 'unavailable' } }
  if (!active?.threads || !active?.members) return { status: 'unavailable' }
  const pending = [...active.threads.values()].filter(thread =>
    thread.guild?.id === message.guild.id && thread.isThread?.() && !thread.archived &&
    !active.members.has(thread.id))
  if (!pending.length) return { status: 'none' }
  let joined = 0, failed = 0
  for (const thread of pending.slice(0, BULK_LIMIT)) {
    if (client._shuttingDown) break
    try {
      if (!thread.permissionsFor(auth.actor)?.has(F.ViewChannel) ||
          !thread.permissionsFor(auth.bot)?.has(F.ViewChannel)) { failed++; continue }
      const updated = await thread.join()
      if (updated?.id !== thread.id) { failed++; continue }
      joined++
      await logConfirmed(client, message, 'jointhread', thread)
    } catch { failed++ }
  }
  return { status: 'bulk', joined, failed,
    remaining: pending.length - joined - failed, limit: BULK_LIMIT }
}

async function deleteThread(client, message, args) {
  const id = selectedThreadId(message, args)
  if (!validId(id)) return { status: 'invalidThread' }
  const auth = await access(client, message, 'deletethread')
  if (auth.status !== 'allowed') return auth
  let thread
  try { thread = await threadFor(message.guild, id) }
  catch { return { status: 'unavailable' } }
  if (!thread) return { status: 'invalidThread' }
  try {
    if (!thread.permissionsFor(auth.actor)?.has(F.ViewChannel)) return { status: 'accessDenied' }
    if (!thread.permissionsFor(auth.bot)?.has(F.ManageThreads)) return { status: 'botPermission' }
  } catch { return { status: 'unavailable' } }
  if (client._shuttingDown) return { status: 'unavailable' }
  let deleted
  try { deleted = await thread.delete(`OBEY deletethread by ${message.author.id}`) }
  catch { return { status: 'unavailable' } }
  if (deleted?.id !== id) return { status: 'unconfirmed' }
  await logConfirmed(client, message, 'deletethread', thread)
  return { status: 'deleted', threadId: id }
}

module.exports = { changeThreadMembership, joinActiveThreads, deleteThread, selectedThreadId, BULK_LIMIT }
