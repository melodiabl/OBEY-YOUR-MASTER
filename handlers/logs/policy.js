const { PermissionFlagsBits: F, GatewayIntentBits: I } = require('discord.js')
const { audienceFits } = require('./audience')
const CATEGORIES = Object.freeze(['server', 'members', 'moderation', 'messages', 'voice'])
const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const read = (map, key) => map instanceof Map ? map.get(key) : map?.[key]

function resolveLogDestination(settings, category) {
  if (!CATEGORIES.includes(category)) return { channelId: null, state: 'invalid' }
  const value = read(settings?.logChannels, category)
  if (value === false || value === '' || value === 'no' || value === 'nochannel') return { channelId: null, state: 'disabled' }
  if (value != null && value !== 'inherit') return { channelId: validId(value) ? value : null, state: validId(value) ? 'configured' : 'invalid' }
  const legacy = settings?.logger?.channel
  if (validId(legacy)) return { channelId: legacy, state: 'inherited' }
  // Older moderation commands used a separate adminlog setting. An explicit
  // category disable above still wins; other categories never inherit it.
  if (category === 'moderation' && (legacy == null || legacy === 'no' || legacy === 'nochannel')) {
    const adminlog = settings?.adminlog
    if (validId(adminlog)) return { channelId: adminlog, state: 'legacy_adminlog' }
  }
  return { channelId: null, state: 'unset' }
}

const canObserveModerationAudit = (client, guild) => Boolean(
  guild?.members?.me?.permissions?.has(F.ViewAuditLog) && client.options?.intents?.has(I.GuildModeration)
)

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

// Preserve the source audience, including access through roles and members.
function mayRevealSource(source, destination, guild) {
  if (destination.guildId !== guild.id || source && source.guildId !== guild.id) return false
  if (source?.id === destination.id || adminOnly(destination, guild)) return true
  if (!source || source.isThread?.()) return false
  return audienceFits(source, destination, guild)
}

function includeMessageContent(settings, source, destination, guild) {
  return settings?.logger?.includeMessageContent === true && Boolean(source) && !source.nsfw && !source.parent?.nsfw && mayRevealSource(source, destination, guild)
}

module.exports = { CATEGORIES, resolveLogDestination, mayRevealSource, includeMessageContent, mayRevealAudit, canObserveModerationAudit }
