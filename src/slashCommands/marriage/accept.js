const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { acceptMarriage } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Acepta una propuesta de matrimonio pendiente'),
  async execute (client, interaction) {
    const result = await acceptMarriage(interaction.user.id, client.db)

    if (!result.ok) {
      return interaction.reply({
        content: `${Emojis.error} ${result.message || 'No tienes propuestas pendientes.'}`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setTitle('💖 ¡Propuesta Aceptada!')
      .setDescription(`${interaction.user} y <@${result.proposerId}> ahora están casados!`)
      .setColor('Red')
      .addFields({ name: 'Resultado', value: `${Emojis.crown} Una nueva pareja ha nacido.` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
