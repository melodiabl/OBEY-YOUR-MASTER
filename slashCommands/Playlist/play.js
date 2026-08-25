const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')
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

    const playlist = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${name}$`, 'i') } })
      .catch(() => null)

    if (!playlist || !playlist.tracks.length)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(
          !playlist
            ? `❌ No tienes una playlist llamada **${name}**.`
            : `❌ La playlist **${name}** está vacía.`
        )],
        ephemeral: true,
      })

    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')],
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
      for (const track of tracks) state.queue.push(track)
      if (wasIdle) await client.music._playNext(guildId, player)

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(0x1DB954)
            .setTitle(`▶️ Playlist: ${playlist.name}`)
            .setDescription(`**${playlist.tracks.length}** canciones ${wasIdle ? 'reproduciendo ahora' : 'agregadas a la cola'}.`)
            .addFields(
              { name: '🎵 Primera canción', value: playlist.tracks[0].title, inline: true },
              { name: '🔊 Canal',           value: voiceChannel.name,         inline: true },
            )
            .setFooter({ text: `Pedido por ${interaction.user.username}` }),
        ],
      })
    } catch (e) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ Error al reproducir: ${e.message}`)],
      })
    }
  },
}
