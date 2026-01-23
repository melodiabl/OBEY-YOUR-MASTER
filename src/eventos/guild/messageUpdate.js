const systems = require('../../systems')

module.exports = async (client, oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.author?.bot) return
  await systems.logs.sendLog(newMessage.guild, 'messageUpdate', { oldMessage, newMessage })
}
