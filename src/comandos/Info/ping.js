const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Mira el ping del bot',
  async execute (client, message) {
    return replyEmbed(client, message, {
      system: 'utility',
      kind: 'info',
      title: `${Emojis.stats} Ping`,
      description: [
        headerLine(Emojis.utility, 'Estado'),
        `${Emojis.dot} **WebSocket:** ${Format.inlineCode(`${client.ws.ping}ms`)}`,
        `${Emojis.dot} **Uptime:** ${Format.inlineCode(`${Math.floor(process.uptime())}s`)}`
      ].join('\n'),
      signature: 'Rápido y estable'
    })
  }
}

