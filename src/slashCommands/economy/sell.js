const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vende un ítem de tu inventario')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nombre del ítem a vender')
        .setRequired(true)
        .addChoices(
          { name: 'Pan', value: 'Pan' },
          { name: 'Hacha', value: 'Hacha' },
          { name: 'Caña', value: 'Caña' },
          { name: 'Elixir', value: 'Elixir' },
          { name: 'Escudo', value: 'Escudo' }
        )
    ),
  async execute (client, interaction) {
    const itemName = interaction.options.getString('item')
    const items = {
      pan: 50,
      hacha: 100,
      caña: 150,
      elixir: 200,
      escudo: 250
    }
    const price = items[itemName.toLowerCase()]

    if (!price) {
      return interaction.reply({ content: `${Emojis.error} Ítem no válido.`, ephemeral: true })
    }

    const userData = await client.db.getUserData(interaction.user.id)
    userData.inventory = userData.inventory || []

    // Buscar el item (case insensitive)
    const index = userData.inventory.findIndex(i => i.toLowerCase() === itemName.toLowerCase())

    if (index === -1) {
      return interaction.reply({
        content: `${Emojis.error} No tienes ${Format.bold(itemName)} en tu inventario.`,
        ephemeral: true
      })
    }

    const sellPrice = Math.floor(price / 2)
    userData.inventory.splice(index, 1)
    userData.money = (userData.money || 0) + sellPrice
    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.money} Venta Exitosa`)
      .setDescription(`Has vendido ${Format.bold(itemName)} por ${Emojis.money} ${Format.inlineCode(sellPrice.toString())}`)
      .setColor('Orange')
      .addFields({ name: 'Saldo Actual', value: `${Emojis.money} ${Format.inlineCode(userData.money.toString())}` })
      .setFooter({ text: 'Recibes el 50% del valor de compra' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
