const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { money } = require('../../slashCommands/economy/_catalog')

function itemEmoji (item) {
  const e = item?.meta?.emoji
  return e ? String(e) : Emojis.inventory
}

module.exports = {
  DESCRIPTION: 'Lista items de la tienda (persistente).',
  ALIASES: ['tienda'],
  async execute (client, message, args) {
    const query = String((Array.isArray(args) ? args.join(' ') : '') || '').trim()
    const rows = await Systems.items.listShop({ query })

    if (!rows.length) {
      return replyWarn(client, message, {
        system: 'economy',
        title: 'Sin resultados',
        lines: [`${Emojis.dot} No encontre items para ${Format.inlineCode(query || 'tu busqueda')}.`]
      })
    }

    const lines = rows.map((it) => {
      const buy = Number(it.buyPrice || 0)
      const sell = Number(it.sellPrice || 0)
      return `${Emojis.dot} ${itemEmoji(it)} ${Format.bold(it.name)} ${Format.subtext(it.itemId)} — ${Emojis.money} ${Format.inlineCode(money(buy))} / ${Format.inlineCode(money(sell))}`
    })

    return replyEmbed(client, message, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.shop} Tienda`,
      description: [
        headerLine(Emojis.shop, query ? `Catalogo (filtro: ${query})` : 'Catalogo'),
        lines.join('\n'),
        Format.softDivider(20),
        `${Emojis.dot} Comprar: ${Format.inlineCode('buy <id> [cantidad]')}`,
        `${Emojis.dot} Vender: ${Format.inlineCode('sell <id> [cantidad]')}`,
        `${Emojis.dot} Inventario: ${Format.inlineCode('inventory')}`
      ].join('\n'),
      signature: 'Tienda real (DB)'
    })
  }
}
