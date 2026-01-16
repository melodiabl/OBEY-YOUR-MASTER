const { getPlayer } = require('../../music/player')
const { QueryType } = require('discord-player')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')

function isUrl (q) {
  return /^https?:\/\//i.test(String(q || '').trim())
}

function isSpotifyUrl (q) {
  const s = String(q || '').toLowerCase()
  return s.includes('open.spotify.com') || s.includes('spotify.link') || s.startsWith('spotify:')
}

module.exports = {
  DESCRIPTION: 'Reproduce musica en tu canal de voz (YouTube / Spotify).',
  ALIASES: ['p'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message, args) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) return message.reply('Debes unirte a un canal de voz para reproducir musica.')

    const me = message.guild.members.me || message.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) return message.reply('No tengo permisos para unirme o hablar en ese canal de voz.')

    const query = args.join(' ').trim()
    if (!query) return message.reply('Debes proporcionar un enlace o busqueda.')

    if (isSoundCloudUrl(query)) {
      return message.reply('SoundCloud no esta soportado. Usa YouTube o Spotify.')
    }

    const player = getPlayer(client)
    if (!player) return message.reply('El reproductor de musica no esta inicializado.')

    try {
      const nodeOptions = {
        metadata: { channel: message.channel },
        leaveOnEmpty: false,
        leaveOnEnd: false,
        leaveOnStop: false,
        selfDeaf: true
      }

      const qIsUrl = isUrl(query)
      const searchEngine = qIsUrl ? undefined : QueryType.YOUTUBE_SEARCH

      const res = await player.play(voiceChannel, query, {
        requestedBy: message.author,
        searchEngine,
        nodeOptions
      })

      const playlistTitle = res?.searchResult?.playlist?.title
      if (playlistTitle) {
        return message.reply(`Playlist agregada: **${playlistTitle}** (${res.searchResult.tracks.length} pistas)`)
      }

      return message.reply(`Agregado a la cola: **${res.track.title}**`)
    } catch (e) {
      const msg = String(e?.message || e || '').toLowerCase()
      if (msg.includes('no available extractor')) {
        if (isSpotifyUrl(query)) {
          return message.reply('No hay extractor de Spotify disponible o falta configurar credenciales. Usa un enlace de YouTube o configura `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`.')
        }
        return message.reply('Ese enlace no esta soportado. Usa YouTube o Spotify.')
      }
      if (msg.includes('no results') || msg.includes('no result') || msg.includes('not found')) {
        return message.reply(`No se encontraron resultados para: \`${query}\``)
      }
      return message.reply(`No pude reproducir: ${e?.message || e}`)
    }
  }
}
