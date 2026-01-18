const marriageManager = require('../../utils/marriageManager')

module.exports = {
  DESCRIPTION: 'Acepta una propuesta de matrimonio',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message) {
    const proposerId = marriageManager.getProposer(message.author.id)
    if (!proposerId) return message.reply('No tienes ninguna propuesta pendiente.')
    const proposerData = await client.db.getUserData(proposerId)
    const userData = await client.db.getUserData(message.author.id)
    if (proposerData.partner || userData.partner) {
      marriageManager.reject(message.author.id)
      return message.reply('La propuesta ya no es válida porque alguien se casó.')
    }
    proposerData.partner = message.author.id
    userData.partner = proposerId
    await proposerData.save()
    await userData.save()
    marriageManager.accept(message.author.id)
    message.reply(`¡Felicidades! Ahora estás casado con <@${proposerId}>.`)
  }
}
