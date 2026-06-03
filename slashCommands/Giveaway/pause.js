module.exports = {
  name: 'pause',
  description: 'Pausar un sorteo activo',
  memberpermissions: ['ManageMessages'],
  options: [
    { String: { name: 'message_id', description: 'ID del mensaje del sorteo', required: true } },
  ],
  run: async (client, interaction) => {
    const messageId = interaction.options.getString('message_id')
    const giveaway = client.giveawaysManager.giveaways.find(
      g => g.messageId === messageId && g.guildId === interaction.guild.id
    )
    if (!giveaway) return interaction.reply({ content: `❌ No se encontró sorteo con ID: \`${messageId}\``, ephemeral: true })
    if (giveaway.ended) return interaction.reply({ content: '❌ El sorteo ya terminó.', ephemeral: true })
    if (giveaway.pauseOptions?.isPaused) return interaction.reply({ content: '❌ El sorteo ya está pausado.', ephemeral: true })
    try {
      await giveaway.pause()
      await interaction.reply({ content: '✅ Sorteo pausado.', ephemeral: true })
    } catch (e) {
      await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true })
    }
  },
}
