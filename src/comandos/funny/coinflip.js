const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Lanza una moneda.',
  ALIASES: ['flip', 'coin'],
  async execute (client, message) {
    const isHeads = Math.random() < 0.5
    const face = isHeads ? '🪙 Cara' : '🪙 Cruz'
    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.fun} Coinflip`,
      description: [
        headerLine('🪙', 'Resultado'),
        `${Emojis.dot} ${Format.bold(face)}`
      ].join('\n'),
      signature: 'Azar puro'
    })
  }
}
