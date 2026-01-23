const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra tu estado de matrimonio',
  ALIASES: ['marriage', 'marryinfo'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    if (!userData.partner) {
      return replyWarn(client, message, {
        system: 'fun',
        title: 'Soltero/a',
        lines: [`${Emojis.dot} No estás casado.`],
        signature: '𓆩♡𓆪 a tu ritmo 𓆩♡𓆪'
      })
    }

    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.reputation} Estado`,
      description: [
        headerLine(Emojis.star, 'Matrimonio'),
        `${Emojis.dot} Estás casado con <@${userData.partner}>.`,
        `${Emojis.dot} Usuario: ${Format.inlineCode(message.author.id)}`
      ].join('\n')
    })
  }
}

