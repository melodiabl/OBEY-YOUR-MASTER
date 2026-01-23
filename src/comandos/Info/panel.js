const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Acceso rápido al panel premium (slash).',
  ALIASES: ['control', 'dashboard'],
  async execute (client, message) {
    return replyEmbed(client, message, {
      system: 'config',
      kind: 'info',
      title: `${Emojis.system} Panel`,
      description: [
        headerLine(Emojis.system, 'Centro de control'),
        `${Emojis.dot} Abre el panel premium con: ${Format.inlineCode('/panel')}`,
        `${Emojis.dot} Ayuda premium: ${Format.inlineCode('/help')}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Format.italic('Este comando existe para modo compat (sin perder UX).')}`
      ].join('\n'),
      signature: 'Diseñado para comunidades grandes'
    })
  }
}
