const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Muestra la tienda de ítems disponibles'),
  async execute (client, interaction) {
    const items = [
      { name: 'Pan', price: 50, desc: 'Recupera un poco de energía' },
      { name: 'Hacha', price: 100, desc: 'Para talar árboles' },
      { name: 'Caña', price: 150, desc: 'Para pescar en el río' },
      { name: 'Elixir', price: 200, desc: 'Potenciador de habilidades' },
      { name: 'Escudo', price: 250, desc: 'Protección contra robos' }
    ]

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.shop} Tienda Global`)
      .setDescription(Format.subtext('Usa `/buy <item>` para comprar algo'))
      .setColor('Gold')
      .setTimestamp()

    const shopList = items.map(item =>
      `${Emojis.diamond} **${item.name}** — ${Emojis.money} ${Format.inlineCode(item.price.toString())}\n${Format.subtext(item.desc)}`
    ).join('\n\n')

    embed.addFields({ name: 'Items Disponibles', value: shopList })

    await interaction.reply({ embeds: [embed] })
  }
}
