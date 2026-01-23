const systems = require('../../systems')

module.exports = async (client, channel) => {
  if (!channel.guild) return
  await systems.logs.sendLog(channel.guild, 'channelDelete', { channel })
}
