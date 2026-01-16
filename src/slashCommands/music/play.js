const { SlashCommandBuilder } = require('discord.js')
const { QueryType } = require('discord-player')
const { getPlayer } = require('../../music/player')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')

function isUrl (q) {
  return /^https?:\/\//i.test(String(q || '').trim())
}

function isSpotifyUrl (q) {
  const s = String(q || '').toLowerCase()
  return s.includes('open.spotify.com') || s.includes('spotify.link') || s.startsWith('spotify:')
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce musica en tu canal de voz (YouTube / Spotify)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enlace o busqueda')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const query = interaction.options.getString('query', true).trim()
    if (isSoundCloudUrl(query)) {
      return interaction.reply({ content: 'SoundCloud no esta soportado en este bot. Usa YouTube o Spotify.', ephemeral: true })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return interaction.reply({ content: 'No tengo permisos para unirme o hablar en ese canal de voz.', ephemeral: true })
    }

    await interaction.deferReply()

    const player = getPlayer(client)
    if (!player) return interaction.editReply('El reproductor de musica no esta inicializado.')

    const existingQueue = player.nodes.get(interaction.guild.id)
    if (existingQueue?.channel && voiceChannel.id !== existingQueue.channel.id) {
      return interaction.editReply('Ya estoy reproduciendo musica en otro canal de voz. Unete a ese canal para controlarme.')
    }

    try {
      const nodeOptions = {
        metadata: { channel: interaction.channel },
        leaveOnEmpty: false,
        leaveOnEnd: false,
        leaveOnStop: false,
        selfDeaf: true
      }

      const attempts = isUrl(query)
        ? [{ engine: null, label: null }]
        : [{ engine: QueryType.YOUTUBE_SEARCH, label: 'YouTube' }]

      let lastError = null
      for (const attempt of attempts) {
        try {
          const res = await player.play(voiceChannel, query, {
            requestedBy: interaction.user,
            searchEngine: attempt.engine || undefined,
            nodeOptions
          })

          const playlistTitle = res?.searchResult?.playlist?.title
          if (playlistTitle) {
            return interaction.editReply(`Playlist agregada: **${playlistTitle}** (${res.searchResult.tracks.length} pistas)`)
          }

          return interaction.editReply(`Agregado a la cola: **${res.track.title}**`)
        } catch (e) {
          lastError = e
          const msg = String(e?.message || e || '').toLowerCase()
          const isNoExtractor = msg.includes('no available extractor') || msg.includes('no extractor')
          const isNoResult = e?.name === 'NoResultError' || msg.includes('no result') || msg.includes('no results') || msg.includes('no tracks') || msg.includes('not found')
          if (isNoExtractor) break
          if (isNoResult && attempt.label) continue
          break
        }
      }

      const errMsg = lastError?.message || String(lastError || 'Error desconocido.')
      if (String(errMsg).toLowerCase().includes('no available extractor')) {
        if (isSpotifyUrl(query)) {
          return interaction.editReply('No hay extractor de Spotify disponible o falta configurar las credenciales. Usa un enlace de YouTube o configura `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`.')
        }
        return interaction.editReply('Ese enlace no esta soportado. Usa YouTube o Spotify.')
      }
      return interaction.editReply(`No pude reproducir \`${query}\`: ${errMsg}`)
    } catch (e) {
      return interaction.editReply(`No pude procesar tu solicitud: ${e?.message || e}`)
    }
  }
}
