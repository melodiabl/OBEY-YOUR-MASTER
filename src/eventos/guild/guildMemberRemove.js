const systems = require('../../systems')

module.exports = async (client, member) => {
  // Logs
  await systems.logs.sendLog(member.guild, 'guildMemberRemove', { member })

  // Leave message
  await systems.welcome.handleLeave(member)
}
