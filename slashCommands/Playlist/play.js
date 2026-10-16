const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')
const { exactPlaylistName } = require('../../handlers/music/playlist-name')
const { toQueueTrack } = require('../../handlers/discordmusiccatalog')
const { isLikedPlaylist, getLikedPlaylist } = require('../../handlers/music/liked-playlist')
const { allowedMusicTrack } = require('../../handlers/music/nodes-config')

module.exports = {
  name: 'play',
  description: 'Reproducir una de tus playlists',
  parameters: { type: 'music', notsamechannel: true },
  options: [
    { String: { name: 'nombre', description: 'Nombre de la playlist', required: true } },
  ],

  run: async (client, interaction) => {
    const userId  = interaction.user.id
    const name    = interaction.options.getString('nombre').trim()
    const guildId = interaction.guild.id

    const playlist = isLikedPlaylist(name) ? await getLikedPlaylist(userId) : await Playlist.findOne({ userId, name: exactPlaylistName(name) })
      .catch(() => null)

    if (!playlist || !playlist.tracks.length)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(
          obeyUi.limit(!playlist
            ? `${obeyUi.markup("icon.error")} No tienes una playlist llamada **${name}**.`
            : `${obeyUi.markup("icon.error")} La playlist **${name}** está vacía.`, 4096)
        )],
        ephemeral: true,
      })

    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))],
        ephemeral: true,
      })

    await interaction.deferReply()

    try {
      const tracks = playlist.tracks.map(t => toQueueTrack(
        { info: { ...(typeof t.toObject === 'function' ? t.toObject() : t), length: t.duration } },
        interaction.user
      )).filter(track => {
        try { const uri = new URL(track.info.uri); return ['https:', 'http:'].includes(uri.protocol) && !uri.username && !uri.password && allowedMusicTrack(track) }
        catch { return false }
      })
      if (!tracks.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xF59E0B)
        .setDescription('Esta playlist no tiene canciones disponibles para reproducir.')] })

      const wasIdle = !client.music.getState(guildId).currentTrack
      const added = await client.music.playCollection(guildId, voiceChannel.id, interaction.channelId, tracks, interaction.user)

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x1DB954)
            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.play")} Playlist: ${playlist.name}`, 256))
            .setDescription(obeyUi.limit(`**${added}** canciones ${wasIdle ? 'añadidas a la reproducción' : 'agregadas a la cola'}.`, 4096))
            .addFields(
              { name: obeyUi.owned('🎵 Primera canción'), value: tracks[0].info.title, inline: true },
              { name: obeyUi.owned('🔊 Canal'),           value: voiceChannel.name,         inline: true },
            )
            .setFooter(obeyMeta.asFooter({ text: `Pedido por ${interaction.user.username}` })),
        ],
      })
    } catch (e) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} Error al reproducir: ${e.message}`, 4096))],
      })
    }
  },
}
