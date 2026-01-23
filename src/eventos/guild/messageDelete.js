const systems = require('../../systems')

module.exports = async (client, message) => {
  if (!message.guild || message.author?.bot) return
  await systems.logs.sendLog(message.guild, 'messageDelete', { message })
}
