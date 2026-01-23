const marriageManager = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const { replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Acepta una propuesta de matrimonio',
  async execute (client, message) {
    const proposerId = marriageManager.getProposer(message.author.id)
    if (!proposerId) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Sin propuesta',
        lines: [`${Emojis.dot} No tienes ninguna propuesta pendiente.`]
      })
    }

    const proposerData = await client.db.getUserData(proposerId)
    const userData = await client.db.getUserData(message.author.id)

    if (proposerData.partner || userData.partner) {
      marriageManager.reject(message.author.id)
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Propuesta inválida',
        lines: [`${Emojis.dot} Alguien se casó antes de confirmar. Intenta de nuevo.`]
      })
    }

    proposerData.partner = message.author.id
    userData.partner = proposerId
    await proposerData.save()
    await userData.save()
    marriageManager.accept(message.author.id)

    return replyOk(client, message, {
      system: 'fun',
      title: `${Emojis.success} ¡Felicidades!`,
      lines: [`${Emojis.dot} Ahora estás casado con <@${proposerId}>.`],
      signature: 'Que viva el amor'
    })
  }
}

