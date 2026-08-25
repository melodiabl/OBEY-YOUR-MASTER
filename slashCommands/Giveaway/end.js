const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'end',
  description: 'Finalizar un sorteo activo por su ID de mensaje',
  memberpermissions: ['ManageMessages'],
  options: [
    { String: { name: 'message_id', description: 'ID del mensaje del sorteo', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const messageId = interaction.options.getString('message_id')
    const giveaway = client.giveawaysManager.giveaways.find(
      g => g.messageId === messageId && g.guildId === interaction.guild.id
    )
    if (!giveaway) return interaction.reply({ embeds: [err(`❌ No se encontró sorteo con ID: \`${messageId}\``)], ephemeral: true })
    if (giveaway.ended) return interaction.reply({ embeds: [err('❌ El sorteo ya ha terminado.')], ephemeral: true })
    try {
      await giveaway.end()
      await interaction.reply({ embeds: [ok('🎉 ¡Sorteo finalizado!')], ephemeral: true })
    } catch (e) {
      await interaction.reply({ embeds: [err(`❌ Error: ${e.message}`)], ephemeral: true })
    }
  },
}
