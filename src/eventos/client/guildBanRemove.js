const systems = require('../../systems')

module.exports = async (client, ban) => {
  const guild = ban?.guild
  if (!guild) return
  await systems.logs.sendLog(guild, 'guildBanRemove', { ban })
}

