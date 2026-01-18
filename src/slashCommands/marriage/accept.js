const { SlashCommandBuilder } = require('discord.js')
const { acceptMarriage } = require('../../utils/marriageManager')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Acepta una propuesta de matrimonio pendiente'),
  async execute (client, interaction) {
    const result = await acceptMarriage(interaction.user.id)
    if (!result.ok) {
      return interaction.reply({ content: '❌ No tienes propuestas pendientes.', ephermal: true })
    }
    await interaction.reply('💍 ¡Has aceptado la propuesta de matrimonio!')
  }
}
