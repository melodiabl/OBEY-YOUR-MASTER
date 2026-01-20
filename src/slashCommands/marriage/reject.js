const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { rejectMarriage } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reject')
    .setDescription('Rechaza una propuesta de matrimonio pendiente'),
  async execute (client, interaction) {
    const ok = rejectMarriage(interaction.user.id)

    if (!ok) {
      return interaction.reply({
        content: `${Emojis.error} No tienes propuestas de matrimonio pendientes.`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setTitle('❌ Propuesta Rechazada')
      .setDescription('Has rechazado la propuesta de matrimonio.')
      .setColor('Red')
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
