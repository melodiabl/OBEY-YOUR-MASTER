const systems = require('../../systems')

module.exports = async (client, oldMember, newMember) => {
  await systems.logs.sendLog(newMember.guild, 'guildMemberUpdate', { oldMember, newMember })
}
