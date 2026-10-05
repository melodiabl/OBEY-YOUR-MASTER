const { createHash } = require('node:crypto')

const order = (a, b) => a.position - b.position || a.id.localeCompare(b.id)
const bitfield = value => String(value?.bitfield ?? value ?? 0)
function structureRevision(channels, roles, roleColors = {}) {
  return createHash('sha256').update(JSON.stringify({ channels, roles, ...(Object.keys(roleColors).length ? { roleColors } : {}) })).digest('hex')
}

async function snapshotGuild(guild) {
  if (!guild || guild.available === false) throw new Error('guild_unavailable')
  // Fresh REST reads: an empty or stale cache must never masquerade as a snapshot.
  const [channelCollection, roleCollection] = await Promise.all([guild.channels.fetch(), guild.roles.fetch()])
  const channels = [...channelCollection.values()].filter(Boolean).map(channel => ({
    id: channel.id, name: channel.name, type: channel.type, parentId: channel.parentId || null,
    position: channel.rawPosition ?? channel.position ?? 0, topic: channel.topic ?? '',
    nsfw: Boolean(channel.nsfw), bitrate: channel.bitrate ?? null, userLimit: channel.userLimit ?? null,
    rateLimitPerUser: channel.rateLimitPerUser ?? 0,
    overwrites: [...(channel.permissionOverwrites?.cache?.values() || [])].map(overwrite => ({
      id: overwrite.id, type: overwrite.type, allow: bitfield(overwrite.allow), deny: bitfield(overwrite.deny),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  })).sort(order)
  const roles = [...roleCollection.values()].map(role => ({
    id: role.id, name: role.name, position: role.position, permissions: bitfield(role.permissions),
    color: role.colors?.primaryColor ?? role.color ?? 0, hoist: Boolean(role.hoist), mentionable: Boolean(role.mentionable), managed: Boolean(role.managed),
  })).sort(order)
  const roleColors = Object.fromEntries([...roleCollection.values()].filter(role => role.colors).sort((a, b) => a.id.localeCompare(b.id)).map(role => [role.id, {
    primaryColor: role.colors.primaryColor, secondaryColor: role.colors.secondaryColor ?? null, tertiaryColor: role.colors.tertiaryColor ?? null,
  }]))
  return { schemaVersion: 1, guildId: guild.id, name: guild.name, capturedAt: new Date().toISOString(),
    completeness: 'structure_only', scope: ['guild_channels', 'roles', 'permission_overwrites'],
    warnings: ['No incluye mensajes, miembros, hilos ni configuración de módulos OBEY.',
      ...(channels.some(channel => ![0, 2, 4].includes(channel.type)) ? ['Los tipos de canal avanzados se conservan y no se editan en esta versión.'] : [])],
    channels, roles, ...(Object.keys(roleColors).length ? { roleColors } : {}), revision: structureRevision(channels, roles, roleColors) }
}

module.exports = { snapshotGuild, structureRevision }
