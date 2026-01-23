const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

const SHOP = {
  pan: 50,
  hacha: 150,
  cana: 200,
  elixir: 500,
  escudo: 300
}

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Lista los artículos disponibles en la tienda',
  ALIASES: ['tienda'],
  async execute (client, message) {
    const lines = Object.entries(SHOP).map(([item, price]) => `${Emojis.dot} ${Format.bold(item)} — ${Emojis.money} ${Format.inlineCode(money(price))}`)

    return replyEmbed(client, message, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.shop} Tienda`,
      description: [
        headerLine(Emojis.shop, 'Catálogo'),
        lines.join('\n'),
        Format.softDivider(20),
        `${Emojis.dot} Comprar: ${Format.inlineCode('buy <item>')}`,
        `${Emojis.dot} Vender: ${Format.inlineCode('sell <item>')}`
      ].join('\n'),
      signature: 'Compra inteligente'
    })
  }
}

