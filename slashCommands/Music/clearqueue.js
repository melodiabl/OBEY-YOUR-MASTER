const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'clearqueue', description: 'Limpia la cola sin detener la cancion actual',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música activa.')] })
    const count = state.queue.length
    state.queue = []
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setTitle('🗑️ Cola limpiada')
      .setDescription(count > 0 ? `**${count}** pista${count !== 1 ? 's' : ''} eliminada${count !== 1 ? 's' : ''} de la cola.` : 'La cola ya estaba vacía.')] })
  },
}
