const { PermissionFlagsBits } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')
const { entries, saveRoleMute, removeMemberMutes, withMemberMute } = require('../infrastructure/role-mute-store')

const MAX_ROLE_DURATION = 365 * 86400000
const MAX_TIMEOUT = 28 * 86400000
const MUTE_OVERWRITE = {
  SendMessages: false,
  AddReactions: false,
  Connect: false,
  Speak: false,
}

function parseDuration(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const ms = require('ms')
  let duration
  try { duration = ms(value.trim()) } catch { return null }
  return Number.isSafeInteger(duration) && duration > 0 && duration <= MAX_ROLE_DURATION ? duration : null
}

async function access(client, guild, actorId, targetId, command, permission) {
  if (client._shuttingDown) return { status: 'stopping' }
  if (!/^\d{17,20}$/.test(String(targetId)) || [actorId, client.user.id, guild.ownerId].includes(targetId))
    return { status: 'invalidTarget' }
  let actor, bot, member
  try {
    await guild.roles.fetch()
    ;[actor, bot, member] = await Promise.all([
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
      guild.members.fetch({ user: targetId, force: true }),
    ])
  } catch { return { status: 'accessUnconfirmed' } }
  if (actor?.id !== actorId || member?.id !== targetId || member.guild?.id !== guild.id)
    return { status: 'accessUnconfirmed' }
  const grant = command === 'tempmute' ? 'mute' : command
  let allowed
  try {
    allowed = prefixAllowed(client, guild, actor, grant) ||
      command === 'permamute' && actor.permissions.has(PermissionFlagsBits.ManageRoles)
  } catch { return { status: 'accessUnconfirmed' } }
  if (!allowed) return { status: 'permission' }
  if (permission && !bot.permissions.has(permission)) return { status: 'botPermission' }
  if (actorId !== guild.ownerId && member.roles.highest.comparePositionTo(actor.roles.highest) >= 0)
    return { status: 'hierarchy' }
  if (client._shuttingDown) return { status: 'stopping' }
  return { status: 'allowed', member, bot }
}

function configuredRole(guild, settings) {
  const configured = settings?.roleId && guild.roles.cache.get(settings.roleId)
  return configured || guild.roles.cache.find(role => !role.managed && role.name.toLowerCase() === 'muted') || null
}

async function ensureRole(guild, bot, settings, create) {
  let role = configuredRole(guild, settings)
  if (!role && create) role = await guild.roles.create({ name: 'muted', permissions: 0n, reason: 'Rol de silencio de OBEY' })
  if (!role || role.managed || role.position >= bot.roles.highest.position) return null
  return role
}

async function prepareRole(guild, bot, role) {
  for (const channel of guild.channels.cache.values()) {
    if (!channel.permissionOverwrites) continue
    const overwrite = channel.permissionOverwrites.cache.get(role.id)
    if (overwrite && [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
    ].every(bit => overwrite.deny.has(bit))) continue
    if (!channel.permissionsFor(bot)?.has(PermissionFlagsBits.ManageChannels)) return false
    try { await channel.permissionOverwrites.edit(role, MUTE_OVERWRITE, { reason: 'Aplicar rol de silencio' }) }
    catch { return false }
  }
  return true
}

async function applyRoleMuteUnlocked(client, { guild, actorId, targetId, command, duration, reason, channelId }) {
  const check = await access(client, guild, actorId, targetId, command, PermissionFlagsBits.ManageRoles)
  if (check.status !== 'allowed') return check
  if (duration !== -1 && (!Number.isSafeInteger(duration) || duration < 1 || duration > MAX_ROLE_DURATION))
    return { status: 'invalidDuration' }
  let role
  try { role = await ensureRole(guild, check.bot, client.settings.get(guild.id, 'mute'), command !== 'mute') }
  catch { return { status: 'roleFailed' } }
  if (!role) return { status: 'roleUnavailable' }
  if (!check.member.manageable) return { status: 'hierarchy' }
  if (!(await prepareRole(guild, check.bot, role))) return { status: 'overwriteFailed' }
  const alreadyHadRole = check.member.roles.cache.has(role.id)
  try { if (!alreadyHadRole) await check.member.roles.add(role, String(reason || '').slice(0, 512)) }
  catch { return { status: 'actionFailed' } }
  const entry = {
    guild: guild.id, user: targetId, role: role.id, timestamp: Date.now(),
    mutetime: duration, channel: channelId || '', reason: String(reason || '').slice(0, 512),
  }
  try { await saveRoleMute(client, entry) }
  catch {
    if (!alreadyHadRole) {
      try { await check.member.roles.remove(role, 'No se pudo guardar el silencio') }
      catch { return { status: 'rollbackFailed' } }
    }
    return { status: 'persistenceFailed' }
  }
  return { status: 'applied', member: check.member, mode: 'role', duration, entry }
}

async function applyTimeoutMuteUnlocked(client, { guild, actorId, targetId, duration, reason }) {
  if (!Number.isSafeInteger(duration) || duration < 1 || duration > MAX_TIMEOUT)
    return { status: 'invalidDuration' }
  const check = await access(client, guild, actorId, targetId, 'mute', PermissionFlagsBits.ModerateMembers)
  if (check.status !== 'allowed') return check
  if (!check.member.moderatable) return { status: 'hierarchy' }
  try { await check.member.timeout(duration, String(reason || '').slice(0, 512)) }
  catch { return { status: 'actionFailed' } }
  return { status: 'applied', member: check.member, mode: 'timeout', duration }
}

async function liftMuteUnlocked(client, { guild, actorId, targetId, reason }) {
  const record = entries(client).find(item => item && item.guild === guild.id && item.user === targetId)
  const settings = client.settings.get(guild.id, 'mute')
  let role
  try { await guild.roles.fetch(); role = record?.role ? guild.roles.cache.get(record.role) : configuredRole(guild, settings) }
  catch { return { status: 'accessUnconfirmed' } }
  const check = await access(client, guild, actorId, targetId, 'unmute', null)
  if (check.status !== 'allowed') return check
  if (role && check.member.roles.cache.has(role.id)) {
    if (!check.bot.permissions.has(PermissionFlagsBits.ManageRoles)) return { status: 'botPermission' }
    if (role.position >= check.bot.roles.highest.position || !check.member.manageable) return { status: 'hierarchy' }
    try { await check.member.roles.remove(role, String(reason || '').slice(0, 512)) }
    catch { return { status: 'actionFailed' } }
    try { await removeMemberMutes(client, guild.id, targetId) }
    catch {
      try { await check.member.roles.add(role, 'No se pudo guardar la retirada del silencio') }
      catch { return { status: 'rollbackFailed' } }
      return { status: 'persistenceFailed' }
    }
    return { status: 'applied', member: check.member, mode: 'role' }
  }
  if (check.member.communicationDisabledUntilTimestamp > Date.now()) {
    if (!check.bot.permissions.has(PermissionFlagsBits.ModerateMembers) || !check.member.moderatable)
      return { status: 'botPermission' }
    try { await check.member.timeout(null, String(reason || '').slice(0, 512)) }
    catch { return { status: 'actionFailed' } }
    return { status: 'applied', member: check.member, mode: 'timeout' }
  }
  if (record) {
    try { await removeMemberMutes(client, guild.id, targetId) }
    catch { return { status: 'persistenceFailed' } }
  }
  return { status: 'notMuted' }
}

const applyRoleMute = (client, input) => withMemberMute(input.guild.id, input.targetId,
  () => applyRoleMuteUnlocked(client, input))
const applyTimeoutMute = (client, input) => withMemberMute(input.guild.id, input.targetId,
  () => applyTimeoutMuteUnlocked(client, input))
const liftMute = (client, input) => withMemberMute(input.guild.id, input.targetId,
  () => liftMuteUnlocked(client, input))

module.exports = { applyRoleMute, applyTimeoutMute, liftMute, parseDuration, MAX_TIMEOUT }
