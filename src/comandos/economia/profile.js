const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Muestra tu perfil económico',
  ALIASES: ['perfil'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const inv = Array.isArray(userData.inventory) ? userData.inventory : []

    return replyEmbed(client, message, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.economy} Perfil`,
      description: [
        headerLine(Emojis.economy, message.author.tag),
        `${Emojis.dot} ${Emojis.money} **Efectivo:** ${Format.inlineCode(money(userData.money || 0))}`,
        `${Emojis.dot} ${Emojis.bank} **Banco:** ${Format.inlineCode(money(userData.bank || 0))}`,
        `${Emojis.dot} ${Emojis.inventory} **Inventario:** ${Format.inlineCode(inv.length)}`,
        `${Emojis.dot} ${Emojis.human} **Pareja:** ${userData.partner ? `<@${userData.partner}>` : Format.italic('Ninguna')}`
      ].join('\n'),
      thumbnail: message.author.displayAvatarURL({ size: 256 }),
      signature: 'Progreso real'
    })
  }
}

