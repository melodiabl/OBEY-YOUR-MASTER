const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { formatDuration } = require('../../utils/timeFormat')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra el uptime del bot.',
  ALIASES: ['up'],
  async execute (client, message) {
    const uptimeMs = Math.floor(process.uptime() * 1000)
    const uptime = formatDuration(uptimeMs)
    const since = Math.floor((Date.now() - uptimeMs) / 1000)

    return replyEmbed(client, message, {
      system: 'infra',
      kind: 'info',
      title: `${Emojis.loading} Uptime`,
      description: [
        headerLine(Emojis.system, 'Estado'),
        `${Emojis.dot} **Tiempo activo:** ${Format.inlineCode(uptime)}`,
        `${Emojis.dot} **Desde:** <t:${since}:R>`
      ].join('\n'),
      signature: 'Sin caídas'
    })
  }
}
