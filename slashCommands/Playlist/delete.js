const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

module.exports = {
  name: 'delete',
  description: 'Eliminar una de tus playlists',
  options: [
    { String: { name: 'nombre', description: 'Nombre de la playlist a eliminar', required: true } },
  ],
  run: async (client, interaction) => {
    const name = interaction.options.getString('nombre').trim()
    await interaction.deferReply({ ephemeral: true })

    const playlist = await Playlist.findOneAndDelete({
      userId: interaction.user.id,
      name:   { $regex: new RegExp(`^${name}$`, 'i') },
    }).catch(() => null)

    if (!playlist)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setDescription(`❌ No tienes una playlist llamada **${name}**.`)],
      })

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle('🗑️ Playlist eliminada')
        .setDescription(`**${playlist.name}** eliminada correctamente (${playlist.tracks.length} canciones).`)],
    })
  },
}
