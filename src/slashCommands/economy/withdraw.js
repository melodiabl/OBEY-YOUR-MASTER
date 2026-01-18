const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Retira dinero del banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a retirar')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad')
    const userData = await client.db.getUserData(interaction.user.id)
    if (amount <= 0 || (userData.bank || 0) < amount) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero en el banco.', ephermal: true })
    }
    userData.bank -= amount
    userData.money = (userData.money || 0) + amount
    await userData.save()
    await interaction.reply(`💸 Has retirado **${amount} monedas** de tu banco.`)
  }
}
