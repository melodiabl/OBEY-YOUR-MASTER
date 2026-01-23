const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed } = require('../../core/ui/interactionKit')
const { CATALOG, money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Tienda: lista de artículos'),

  async execute (client, interaction) {
    const lines = Object.entries(CATALOG).map(([key, it]) => `${Emojis.dot} ${it.emoji} ${Format.bold(it.name)} — ${Emojis.money} ${Format.inlineCode(money(it.price))}`)

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.shop} Tienda`,
      description: [
        headerLine(Emojis.shop, 'Catálogo'),
        lines.join('\n'),
        Format.softDivider(20),
        `${Emojis.dot} Comprar: ${Format.inlineCode('/buy')}`,
        `${Emojis.dot} Vender: ${Format.inlineCode('/sell')}`
      ].join('\n'),
      signature: 'Compra inteligente'
    }, { ephemeral: true })
  }
}

