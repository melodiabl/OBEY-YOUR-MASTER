const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Compra un ítem de la tienda')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nombre del ítem a comprar')
        .setRequired(true)
        .addChoices(
          { name: 'Pan (50)', value: 'Pan' },
          { name: 'Hacha (100)', value: 'Hacha' },
          { name: 'Caña (150)', value: 'Caña' },
          { name: 'Elixir (200)', value: 'Elixir' },
          { name: 'Escudo (250)', value: 'Escudo' }
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
    if ((userData.money || 0) < price) {
      return interaction.reply({
        content: `${Emojis.error} No tienes suficiente dinero. Te faltan ${Emojis.money} ${Format.inlineCode((price - userData.money).toString())}`,
        ephemeral: true
      })
    }

    userData.money -= price
    userData.inventory = userData.inventory || []
    userData.inventory.push(itemName)
    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.success} Compra Exitosa`)
      .setDescription(`Has adquirido ${Format.bold(itemName)} por ${Emojis.money} ${Format.inlineCode(price.toString())}`)
      .setColor('Green')
      .addFields({ name: 'Saldo Actual', value: `${Emojis.money} ${Format.inlineCode(userData.money.toString())}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
