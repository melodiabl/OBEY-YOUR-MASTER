const systems = require('../../systems')
const GuildSchema = require('../../database/schemas/GuildSchema')

module.exports = async (client, member) => {
  // Seguridad (anti-raid / alt detection)
  try {
    await systems.security.handleMemberJoin({ client, member })
  } catch (e) {}

  // Sistema de Auto-Rol
  const guildData = await GuildSchema.findOne({ guildID: member.guild.id })
  if (guildData && guildData.autoRole) {
    const role = member.guild.roles.cache.get(guildData.autoRole)
    if (role) {
      member.roles.add(role).catch(() => {})
    }
  }

  // Moderación: mute permanente (re-aplica rol al reingresar)
  try {
    const gd = guildData || (await client.db.getGuildData(member.guild.id).catch(() => null))
    const mutedRoleId = gd?.mutedRoleId || null
    if (mutedRoleId) {
      const state = await systems.moderation.getPermanentMuteState({ guildID: member.guild.id, targetID: member.id }).catch(() => null)
      if (state?.permMuted) {
        const mutedRole = member.guild.roles.cache.get(mutedRoleId)
        if (mutedRole) {
          await member.roles.add(mutedRole, 'Permanent mute: reapply on join').catch(() => {})
        }
      }
    }
  } catch (e) {}

  // Logs
  await systems.logs.sendLog(member.guild, 'guildMemberAdd', { member })

  // Welcome
  await systems.welcome.handleJoin(member)
}
