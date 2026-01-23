const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Apuesta una cantidad de dinero')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a apostar')
        .setRequired(true)
        .setMinValue(10)),

  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad')
    const userData = await UserSchema.findOne({ userID: interaction.user.id })

    if (!userData || userData.money < amount) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero para apostar esa cantidad.', ephemeral: true })
    }

    const win = Math.random() > 0.5
    const multiplier = 2

    if (win) {
      const profit = amount * (multiplier - 1)
      userData.money += profit
      await userData.save()

      const winEmbed = new EmbedBuilder()
        .setTitle('🎰 ¡Ganaste!')
        .setDescription(`Has ganado **${profit}** monedas.\nAhora tienes **${userData.money}** monedas.`)
        .setColor('Green')
        .setTimestamp()

      await interaction.reply({ embeds: [winEmbed] })
    } else {
      userData.money -= amount
      await userData.save()

      const loseEmbed = new EmbedBuilder()
        .setTitle('💸 ¡Perdiste!')
        .setDescription(`Has perdido **${amount}** monedas.\nAhora tienes **${userData.money}** monedas.`)
        .setColor('Red')
        .setTimestamp()

      await interaction.reply({ embeds: [loseEmbed] })
    }
  }
}
