const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')
const { exactPlaylistName } = require('../../handlers/music/playlist-name')
const { toQueueTrack } = require('../../handlers/discordmusiccatalog')

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

    const playlist = await Playlist.findOne({ userId, name: exactPlaylistName(name) })
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
      const fakeMsg = {
        guild:   interaction.guild,
        author:  interaction.user,
        channel: { id: interaction.channelId },
      }

      const player = await client.music.joinChannel(guildId, voiceChannel.id, interaction.channelId)
      const state  = client.music.getState(guildId)

      const tracks = playlist.tracks.map(t => toQueueTrack(
        { info: { ...t.toObject(), length: t.duration } },
        interaction.user
      ))

      const wasIdle = !state.currentTrack
      await client.music.enqueue(guildId, tracks)

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x1DB954)
            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.play")} Playlist: ${playlist.name}`, 256))
            .setDescription(obeyUi.limit(`**${playlist.tracks.length}** canciones ${wasIdle ? 'reproduciendo ahora' : 'agregadas a la cola'}.`, 4096))
            .addFields(
              { name: obeyUi.owned('🎵 Primera canción'), value: playlist.tracks[0].title, inline: true },
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
