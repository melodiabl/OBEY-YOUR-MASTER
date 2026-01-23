const Emojis = require('../../utils/emojis')
const { replyWarn, replyOk } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Rompe tu matrimonio actual',
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    if (!userData.partner) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'No estás casado',
        lines: [`${Emojis.dot} No hay nada que romper.`]
      })
    }

    const partnerId = userData.partner
    const partnerData = await client.db.getUserData(partnerId)
    userData.partner = null
    partnerData.partner = null
    await userData.save()
    await partnerData.save()

    return replyOk(client, message, {
      system: 'fun',
      title: 'Divorcio confirmado',
      lines: [`${Emojis.dot} Ya no estás casado con <@${partnerId}>.`],
      signature: 'Etapa cerrada'
    })
  }
}

