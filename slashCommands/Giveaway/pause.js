const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'pause',
  description: 'Pausar un sorteo activo',
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
    if (giveaway.ended) return interaction.reply({ embeds: [err('❌ El sorteo ya terminó.')], ephemeral: true })
    if (giveaway.pauseOptions?.isPaused) return interaction.reply({ embeds: [err('❌ El sorteo ya está pausado.')], ephemeral: true })
    try {
      await giveaway.pause()
      await interaction.reply({ embeds: [ok('⏸️ Sorteo **pausado**.')], ephemeral: true })
    } catch (e) {
      await interaction.reply({ embeds: [err(`❌ Error: ${e.message}`)], ephemeral: true })
    }
  },
}
