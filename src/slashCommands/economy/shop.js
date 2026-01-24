const { SlashCommandBuilder } = require('discord.js')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

function itemEmoji (item) {
  const e = item?.meta?.emoji
  return e ? String(e) : Emojis.inventory
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Tienda (persistente): lista de items')
    .addStringOption(o => o
      .setName('buscar')
      .setDescription('Filtra por id o nombre (opcional)')
      .setRequired(false)
      .setMaxLength(40)),

  async execute (client, interaction) {
    const query = interaction.options.getString('buscar') || ''
    const rows = await Systems.items.listShop({ query })

    if (!rows.length) {
      return replyWarn(client, interaction, {
        system: 'economy',
        title: 'Sin resultados',
        lines: [
          `${Emojis.dot} No encontre items para ${Format.inlineCode(query || 'tu busqueda')}.`,
          `${Emojis.dot} Tip: prueba con ${Format.inlineCode('/shop')} sin filtro.`
        ]
      }, { ephemeral: true })
    }

    const lines = rows.map((it) => {
      const buy = Number(it.buyPrice || 0)
      const sell = Number(it.sellPrice || 0)
      return `${Emojis.dot} ${itemEmoji(it)} ${Format.bold(it.name)} ${Format.subtext(it.itemId)} — ${Emojis.money} ${Format.inlineCode(money(buy))} / ${Format.inlineCode(money(sell))}`
    })

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.shop} Tienda`,
      description: [
        headerLine(Emojis.shop, query ? `Catalogo (filtro: ${query})` : 'Catalogo'),
        lines.join('\n'),
        Format.softDivider(20),
        `${Emojis.dot} Comprar: ${Format.inlineCode('/buy item:<id> cantidad:1')}`,
        `${Emojis.dot} Vender: ${Format.inlineCode('/sell item:<id> cantidad:1')}`,
        `${Emojis.dot} Inventario: ${Format.inlineCode('/inventory')}`
      ].join('\n'),
      signature: 'Tienda real (DB)'
    }, { ephemeral: true })
  }
}
