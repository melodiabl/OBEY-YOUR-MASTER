const systems = require('../../systems')
const GuildSchema = require('../../database/schemas/GuildSchema')

module.exports = async (client, member) => {
  // Sistema de Auto-Rol
  const guildData = await GuildSchema.findOne({ guildID: member.guild.id })
  if (guildData && guildData.autoRole) {
    const role = member.guild.roles.cache.get(guildData.autoRole)
    if (role) {
      member.roles.add(role).catch(() => {})
    }
  }

  // Logs
  await systems.logs.sendLog(member.guild, 'guildMemberAdd', { member })

  // Welcome
  await systems.welcome.handleJoin(member)
}
