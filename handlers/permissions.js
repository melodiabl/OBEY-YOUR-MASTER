// OAuth guild membership alone never grants administration.
function canManageGuild(user, guildId) {
  if (typeof guildId !== 'string') return false
  const guild = user?.guilds?.find(item => item.id === guildId)
  if (!guild) return false
  if (guild.owner === true) return true
  try {
    const permissions = BigInt(guild.permissions || 0)
    return permissions >= 0n && (permissions & 40n) !== 0n
  } catch { return false }
}

module.exports = { canManageGuild }
