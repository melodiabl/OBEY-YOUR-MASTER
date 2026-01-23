const { randomAnswer } = require('../../helpers/helpers')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Hazle una pregunta hipotética al bot.',
  ALIASES: ['wi', 'pregunta'],
  async execute (client, message, args) {
    const question = String(args.join(' ') || '').trim()
    if (!question) {
      return replyError(client, message, {
        system: 'fun',
        title: 'Falta la pregunta',
        reason: 'Necesito un texto para “predecir el futuro”.',
        hint: `Ejemplo: ${Format.inlineCode('whatif si mañana llueve?')}`
      })
    }

    const answer = randomAnswer()
    const avatar = message.author.displayAvatarURL({ size: 256 })

    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.fun} ¿Qué pasaría si…?`,
      description: [
        headerLine(Emojis.star, 'Predicción'),
        `${Emojis.quote} ${Format.italic(question.length > 600 ? question.slice(0, 599) + '…' : question)}`,
        Format.softDivider(20),
        `${Emojis.dot} **Respuesta:** ${Format.bold(answer)}`
      ].join('\n'),
      thumbnail: avatar,
      signature: 'Predicción del Maestro'
    })
  }
}

