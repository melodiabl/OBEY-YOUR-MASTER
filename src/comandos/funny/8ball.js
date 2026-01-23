const { EIGHTBALL, pick } = require('../../systems/fun/funContent')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Pregúntale algo a la bola mágica.',
  ALIASES: ['bola', 'magic'],
  async execute (client, message, args) {
    const question = String(args.join(' ') || '').trim()
    if (!question) {
      return replyError(client, message, {
        system: 'fun',
        title: 'Falta la pregunta',
        reason: 'Escribe una pregunta.',
        hint: `Ej: ${Format.inlineCode('8ball voy a ganar?')}`
      })
    }

    const response = pick(EIGHTBALL)
    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.fun} 8ball`,
      description: [
        headerLine(Emojis.star, 'La bola habló'),
        `${Emojis.quote} ${Format.italic(question.length > 400 ? question.slice(0, 399) + '…' : question)}`,
        Format.softDivider(20),
        `${Emojis.dot} **Respuesta:** ${Format.bold(response)}`
      ].join('\n'),
      signature: 'La suerte sonríe (o no)'
    })
  }
}
