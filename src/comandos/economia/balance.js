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
  DESCRIPTION: 'Muestra tu saldo actual.',
  ALIASES: ['bal', 'money'],
  async execute (client, message) {
    const user = message.mentions.users.first() || message.author
    const userData = await client.db.getUserData(user.id)

    const wallet = Number(userData.money || 0)
    const bank = Number(userData.bank || 0)
    const total = wallet + bank

    return replyEmbed(client, message, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.economy} Balance`,
      description: [
        headerLine(Emojis.economy, user.tag),
        `${Emojis.dot} ${Emojis.money} **Efectivo:** ${Format.inlineCode(money(wallet))}`,
        `${Emojis.dot} ${Emojis.bank} **Banco:** ${Format.inlineCode(money(bank))}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Emojis.stats} **Total:** ${Format.bold(money(total))}`
      ].join('\n'),
      thumbnail: user.displayAvatarURL({ size: 256 }),
      signature: 'Economía sincronizada'
    })
  }
}

