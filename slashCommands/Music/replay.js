const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'replay', description: 'Reinicia la cancion actual desde el principio',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    try {
      const player = client.shoukaku?.players?.get(interaction.guild.id)
      if (!player) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay reproductor activo.'), 4096))] })
      const track = client.music?.getState(interaction.guild.id)?.currentTrack
      const info = track?.info || track
      await player.seekTo(0)
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(obeyUi.limit('🔄 Canción reiniciada', 256))
        .setDescription(obeyUi.limit(info?.title ? `**${info.title}** reproducida desde el inicio.` : 'Reiniciada desde el principio.', 4096))
        .setThumbnail(info?.artworkUrl || undefined)] })
    } catch (e) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message}`, 4096))] }) }
  },
}
