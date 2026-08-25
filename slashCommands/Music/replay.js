const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'replay', description: 'Reinicia la cancion actual desde el principio',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    try {
      const player = client.shoukaku?.players?.get(interaction.guild.id)
      if (!player) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay reproductor activo.')] })
      const track = client.music?.getState(interaction.guild.id)?.currentTrack
      const info = track?.info || track
      await player.seekTo(0)
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle('🔄 Canción reiniciada')
        .setDescription(info?.title ? `**${info.title}** reproducida desde el inicio.` : 'Reiniciada desde el principio.')
        .setThumbnail(info?.artworkUrl || undefined)] })
    } catch (e) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message}`)] }) }
  },
}
