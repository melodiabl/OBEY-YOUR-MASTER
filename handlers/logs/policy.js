const { PermissionFlagsBits: F } = require('discord.js')
const CATEGORIES = Object.freeze(['server', 'members', 'moderation', 'messages', 'voice'])
const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const read = (map, key) => map instanceof Map ? map.get(key) : map?.[key]

function resolveLogDestination(settings, category) {
  if (!CATEGORIES.includes(category)) return { channelId: null, state: 'invalid' }
  const value = read(settings?.logChannels, category)
  if (value === false || value === '' || value === 'no' || value === 'nochannel') return { channelId: null, state: 'disabled' }
  if (value != null && value !== 'inherit') return { channelId: validId(value) ? value : null, state: validId(value) ? 'configured' : 'invalid' }
  const legacy = settings?.logger?.channel
  return { channelId: validId(legacy) ? legacy : null, state: validId(legacy) ? 'inherited' : 'unset' }
}

function restrictedTo(destination, guild, permission) {
  if (destination.guildId !== guild.id) return false
  const overwrites = destination.permissionOverwrites?.cache
  if (!overwrites?.get(guild.id)?.deny?.has(F.ViewChannel, false)) return false
  for (const overwrite of overwrites.values()) {
    if (!overwrite.allow?.has(F.ViewChannel, false)) continue
    const permissions = overwrite.type === 0 ? guild.roles.cache.get(overwrite.id)?.permissions : overwrite.type === 1 ? guild.members?.cache?.get(overwrite.id)?.permissions : undefined
    if (!permissions?.has(permission)) return false
  }
  return true
}
const adminOnly = (destination, guild) => restrictedTo(destination, guild, F.Administrator)
// Audit reasons are staff data even when there is no source channel to compare.
const mayRevealAudit = (destination, guild) => restrictedTo(destination, guild, F.ViewAuditLog)

// Conservative proof: same source, an administrator-only destination, or a source
// visible to everyone without any per-role/member ViewChannel denial.
function mayRevealSource(source, destination, guild) {
  if (destination.guildId !== guild.id || source && source.guildId !== guild.id) return false
  if (source?.id === destination.id || adminOnly(destination, guild)) return true
  if (!source || source.isThread?.() || !source.permissionsFor(guild.roles.everyone)?.has(F.ViewChannel)) return false
  const overwrites = source.permissionOverwrites?.cache
  return Boolean(overwrites && ![...overwrites.values()].some(overwrite => overwrite.deny?.has(F.ViewChannel, false)))
}

function includeMessageContent(settings, source, destination, guild) {
  return settings?.logger?.includeMessageContent === true && Boolean(source) && !source.nsfw && !source.parent?.nsfw && mayRevealSource(source, destination, guild)
}

module.exports = { CATEGORIES, resolveLogDestination, mayRevealSource, includeMessageContent, mayRevealAudit }
