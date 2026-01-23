const marriageManager = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const { replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Rechaza una propuesta de matrimonio',
  ALIASES: ['decline'],
  async execute (client, message) {
    const proposerId = marriageManager.getProposer(message.author.id)
    if (!proposerId) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Sin propuesta',
        lines: [`${Emojis.dot} No tienes ninguna propuesta pendiente.`]
      })
    }

    marriageManager.reject(message.author.id)
    return replyWarn(client, message, {
      system: 'fun',
      title: 'Propuesta rechazada',
      lines: [`${Emojis.dot} Rechazaste la propuesta de <@${proposerId}>.`],
      signature: 'Todo bien'
    })
  }
}

