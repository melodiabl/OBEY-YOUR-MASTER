const { EmbedBuilder } = require('discord.js')
const Playlist = require('../../database/schemas/PlaylistSchema')

const MAX_TRACKS = 100

module.exports = {
  name: 'add',
  description: 'Agregar una canción a una playlist (sin canción = agrega la que suena ahora)',
  options: [
    { String: { name: 'playlist', description: 'Nombre de la playlist', required: true } },
    { String: { name: 'cancion',  description: 'Canción a buscar (opcional — sin esto agrega la actual)', required: false } },
  ],

  run: async (client, interaction) => {
    const userId   = interaction.user.id
    const plName   = interaction.options.getString('playlist').trim()
    const query    = interaction.options.getString('cancion')?.trim() || null
    const guildId  = interaction.guild.id

    await interaction.deferReply({ ephemeral: true })

    const playlist = await Playlist.findOne({ userId, name: { $regex: new RegExp(`^${plName}$`, 'i') } })
    if (!playlist)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No tienes una playlist llamada **${plName}**. Usa \`/playlist create\` primero.`)],
      })

    if (playlist.tracks.length >= MAX_TRACKS)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ La playlist ya tiene ${MAX_TRACKS} canciones (límite máximo).`)],
      })

    let track

    if (!query) {
      // Add currently playing track
      const state = client.music?.getState(guildId)
      const current = state?.currentTrack?.info
      if (!current)
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay nada reproduciendo ahora mismo. Pasa una canción en `cancion` o pon música primero.')],
        })
      track = {
        title:      current.title,
        author:     current.author,
        uri:        current.uri,
        artworkUrl: current.artworkUrl ?? null,
        duration:   current.length ?? 0,
        sourceName: current.sourceName || 'spotify',
      }
    } else {
      const result = await client.music?.search(query, interaction.user).catch(() => null)
      const first  = result?.tracks?.[0]
      if (!first)
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No se encontraron resultados para **${query}**.`)],
        })
      const info = first.info || first
      track = {
        title:      info.title,
        author:     info.author,
        uri:        info.uri,
        artworkUrl: info.artworkUrl ?? null,
        duration:   info.length ?? 0,
        sourceName: info.sourceName || 'spotify',
      }
    }

    // Check duplicate
    const dup = playlist.tracks.find(t => t.uri === track.uri)
    if (dup)
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xF59E0B).setDescription(`⚠️ **${track.title}** ya está en la playlist.`)],
      })

    playlist.tracks.push(track)
    await playlist.save()

    const mins  = Math.floor((track.duration / 1000) / 60)
    const secs  = String(Math.floor((track.duration / 1000) % 60)).padStart(2, '0')
    const dur   = track.duration ? `${mins}:${secs}` : '—'

    await interaction.editReply({
      embeds: [
        new EmbedBuilder().setColor(0x1DB954)
          .setTitle('🎵 Canción agregada')
          .setDescription(`**${track.title}** — ${track.author}`)
          .addFields(
            { name: '📋 Playlist', value: playlist.name,                  inline: true },
            { name: '⏱ Duración', value: dur,                             inline: true },
            { name: '🎶 Total',   value: `${playlist.tracks.length} canciones`, inline: true },
          )
          .setThumbnail(track.artworkUrl ?? null),
      ],
    })
  },
}
