const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra links del bot (invite / soporte).',
  ALIASES: ['inv', 'links'],
  async execute (client, message) {
    const invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=0`
    const support = String(process.env.SUPPORT_SERVER || '').trim()
    const website = String(process.env.WEBSITE || '').trim()

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.info} Links`,
      description: [
        headerLine(Emojis.system, 'Conecta'),
        `${Emojis.dot} ${Emojis.arrow} **Invite:** ${invite}`,
        support ? `${Emojis.dot} ${Emojis.ticket} **Support:** ${support}` : null,
        website ? `${Emojis.dot} ${Emojis.star} **Web:** ${website}` : null,
        Format.softDivider(20),
        `${Emojis.dot} ${Format.italic('Tip: el invite usa permissions=0 (recomendado).')}`
      ].filter(Boolean).join('\n'),
      signature: 'Bienvenido'
    })
  }
}
