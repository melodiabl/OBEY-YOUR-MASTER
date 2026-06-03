module.exports = {
  name: 'reroll',
  description: 'Repetir el sorteo de ganadores de un sorteo terminado',
  memberpermissions: ['ManageMessages'],
  options: [
    { String: { name: 'message_id', description: 'ID del mensaje del sorteo', required: true } },
    { Integer: { name: 'ganadores', description: 'Nuevo número de ganadores (opcional)', required: false } },
  ],
  run: async (client, interaction) => {
    const messageId = interaction.options.getString('message_id')
    const count = interaction.options.getInteger('ganadores')
    const giveaway = client.giveawaysManager.giveaways.find(
      g => g.messageId === messageId && g.guildId === interaction.guild.id
    )
    if (!giveaway) return interaction.reply({ content: `❌ No se encontró sorteo con ID: \`${messageId}\``, ephemeral: true })
    if (!giveaway.ended) return interaction.reply({ content: '❌ El sorteo aún no ha terminado.', ephemeral: true })
    try {
      await giveaway.reroll({ winnerCount: count || undefined })
      await interaction.reply({ content: '🎉 ¡Nuevo ganador sorteado!', ephemeral: true })
    } catch (e) {
      await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true })
    }
  },
}
