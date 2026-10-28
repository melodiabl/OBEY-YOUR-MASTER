const { ChannelType, PermissionFlagsBits: F } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const commands = new Map([
  ['lockchannel', 'lock'], ['channellock', 'lock'],
  ['unlockchannel', 'unlock'], ['channelunlock', 'unlock'],
])

class ChannelLockError extends Error {
  constructor(code, applied = 0) { super(code); this.code = code; this.applied = applied }
}

function targetIds(message, args, guild) {
  const ids = new Set()
  for (const role of message.mentions?.roles?.values?.() || []) ids.add(role.id)
  for (const user of message.mentions?.users?.values?.() || []) ids.add(user.id)
  if (!ids.size) for (const arg of args) {
    const id = String(arg).replace(/\D/g, '')
    if (guild.roles.cache.has(id) || guild.members.cache.has(id)) ids.add(id)
  }
  if (ids.size > 10) throw new ChannelLockError('tooManyTargets')
  return [...ids]
}

async function access(client, guild, channel, actorId, command) {
  if (client._shuttingDown || !validId(guild?.id) || !validId(actorId) || !commands.has(command))
    throw new ChannelLockError('unavailable')
  let actor, bot
  try {
    await guild.roles.fetch()
    ;[actor, bot] = await Promise.all([
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
    ])
  } catch { throw new ChannelLockError('unavailable') }
  if (actor?.id !== actorId || bot?.id !== client.user?.id) throw new ChannelLockError('unavailable')
  try { if (!prefixAllowed(client, guild, actor, command)) throw new ChannelLockError('accessDenied') }
  catch (error) { if (error instanceof ChannelLockError) throw error; throw new ChannelLockError('unavailable') }
  if (!channel.permissionsFor?.(bot)?.has(F.ManageRoles) ||
      !bot.permissions?.has(F.SendMessages) || !bot.permissions?.has(F.AddReactions))
    throw new ChannelLockError('botPermission')
}

function desiredPermissions(mode, everyone) {
  if (mode === 'lock') return { SendMessages: false, AddReactions: false }
  return everyone
    ? { SendMessages: null, AddReactions: null }
    : { SendMessages: true, AddReactions: true }
}

function alreadyApplied(overwrite, mode, everyone) {
  if (mode === 'lock') return overwrite?.deny?.has(F.SendMessages) && overwrite?.deny?.has(F.AddReactions)
  if (!everyone) return overwrite?.allow?.has(F.SendMessages) && overwrite?.allow?.has(F.AddReactions)
  return !overwrite ||
    !overwrite.allow?.has(F.SendMessages) && !overwrite.deny?.has(F.SendMessages) &&
    !overwrite.allow?.has(F.AddReactions) && !overwrite.deny?.has(F.AddReactions)
}

async function changeChannelLock(client, message, args, command) {
  const mode = commands.get(command)
  if (!mode || !message.guild || !validId(message.author?.id)) throw new ChannelLockError('unavailable')
  const guild = message.guild
  const mentioned = message.mentions?.channels?.first?.()
  const candidate = mentioned || guild.channels.cache.get(args[0]) || message.channel
  let channel
  try { channel = await guild.channels.fetch(candidate?.id, { cache: false }) }
  catch { throw new ChannelLockError('unavailable') }
  if (!channel || channel.guild?.id !== guild.id ||
      ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type) ||
      !channel.permissionOverwrites?.edit)
    throw new ChannelLockError('invalidChannel')
  const ids = targetIds(message, args, guild)
  const selected = ids.length ? ids : [guild.roles.everyone.id]
  await access(client, guild, channel, message.author.id, command)
  let applied = 0, unchanged = 0
  for (const id of selected) {
    const role = guild.roles.cache.get(id)
    if (!role) {
      let member
      try { member = await guild.members.fetch({ user: id, force: true }) }
      catch { throw new ChannelLockError(applied ? 'partial' : 'invalidTarget', applied) }
      if (member?.id !== id || member.guild?.id !== guild.id)
        throw new ChannelLockError(applied ? 'partial' : 'invalidTarget', applied)
    }
    try { await access(client, guild, channel, message.author.id, command) }
    catch (error) { if (applied) throw new ChannelLockError('partial', applied); throw error }
    const everyone = id === guild.roles.everyone.id
    const overwrite = channel.permissionOverwrites.cache.get(id)
    if (alreadyApplied(overwrite, mode, everyone)) { unchanged++; continue }
    try {
      await channel.permissionOverwrites.edit(id, desiredPermissions(mode, everyone),
        { reason: `OBEY ${command} by ${message.author.id}` })
    } catch { throw new ChannelLockError(applied ? 'partial' : 'unavailable', applied) }
    applied++
  }
  if (applied && typeof client.logs?.emit === 'function') {
    try { await client.logs.emit({ guildId: guild.id, category: 'server',
      kind: mode === 'lock' ? 'channelLocked' : 'channelUnlocked',
      sourceChannelId: channel.id, actorId: message.author.id, origin: 'command',
      fields: [{ key: 'channel', value: `<#${channel.id}>` },
        { key: 'targets', value: String(selected.length) }] }) }
    catch { /* The channel edit succeeded; log delivery is tracked separately. */ }
  }
  return { mode, channel, applied, unchanged, targets: selected.length }
}

module.exports = { changeChannelLock, ChannelLockError, targetIds, desiredPermissions, alreadyApplied }
