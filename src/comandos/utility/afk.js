const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Activa tu estado AFK (se desactiva al hablar).',
  ALIASES: ['away'],
  async execute (client, message, args) {
    const reason = String(args.join(' ') || '').trim() || 'AFK'
    await Systems.afk.setAfk(message.author.id, reason)

    return replyOk(client, message, {
      system: 'notifications',
      title: 'AFK activado',
      lines: [
        `${Emojis.dot} Razón: ${Format.quote(reason)}`,
        `${Emojis.dot} Se desactiva automáticamente cuando hables de nuevo.`
      ],
      signature: 'Modo AFK'
    })
  }
}
