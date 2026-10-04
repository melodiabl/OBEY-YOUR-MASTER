const { EmbedBuilder } = require('discord.js')
const lyricsProvider = require('../../handlers/music/lyrics')
const { showLyrics } = require('../../handlers/music/lyrics-pagination')

module.exports = {
  name: 'lyrics',
  description: 'Muestra la letra de la canción actual o de una búsqueda',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    {
      String: {
        name: 'cancion',
        description: 'Nombre de la canción (vacío = canción actual)',
        required: false,
      },
    },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    await interaction.deferReply()

    let title, artist
    let isCurrent = () => true
    const query = interaction.options.getString('cancion')

    if (query) {
      const parts = query.split(' - ')
      title  = parts[1] || parts[0]
      artist = parts[1] ? parts[0] : ''
    } else {
      const state = client.music?.getState(interaction.guild.id)
      const track = state?.currentTrack
      if (!track) return interaction.editReply({ embeds: [err('❌ No hay música reproduciéndose. Usa `/lyrics cancion: nombre` para buscar.')] })
      const playbackId = state.playbackId, sessionId = state.sessionId
      isCurrent = () => {
        const latest = client.music?.getState(interaction.guild.id)
        return latest?.currentTrack === track && latest.playbackId === playbackId && latest.sessionId === sessionId
      }
      const info = track.info || track
      title  = info.title  || track.title  || ''
      artist = info.author || track.author || ''
      title = title.replace(/\(Official\s*(Music|Audio|Video|Lyric\s*Video)?\s*\)/gi, '').replace(/\[.*?\]/g, '').trim()
    }

    if (!title) return interaction.editReply({ embeds: [err('❌ No se pudo obtener el título de la canción.')] })

    let lyrics = null
    try { lyrics = await lyricsProvider.fetchLyrics(title, artist) } catch {}
    if (!lyrics) { try { lyrics = await lyricsProvider.fetchLyrics(title, '') } catch {} }

    if (!lyrics) {
      return interaction.editReply({ embeds: [err(`❌ No se encontraron letras para **${title}**${artist ? ` — ${artist}` : ''}.`)] })
    }

    const text = lyrics.plain || lyrics.lines?.map(line => line.text).join('\n')
    await showLyrics(interaction, { text, title, artist, isCurrent })
  },
}
