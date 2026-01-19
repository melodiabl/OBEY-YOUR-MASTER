const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')

function isSpotifyPlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:playlist:')) return true
  if (q.includes('open.spotify.com/playlist/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/playlist/')) return true
  return q.startsWith('https://spotify.link/') ||
    q.startsWith('http://spotify.link/') ||
    q.startsWith('https://spotify.app.link/') ||
    q.startsWith('http://spotify.app.link/')
}

function isYoutubePlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.includes('youtube.com/playlist')) return true
  if (q.includes('youtube.com/watch') && q.includes('list=')) return true
  if (q.includes('youtu.be/') && q.includes('list=')) return true
  return false
}

function normalizeMediaQuery (input) {
  const raw = String(input || '').trim()
  if (!raw) return raw

  const spotifyUri = raw.match(/\bspotify:(album|playlist|track):[a-z0-9]+\b/i)
  if (spotifyUri) return spotifyUri[0]

  const url = raw.match(/https?:\/\/\S+/i)
  if (url) {
    const cleaned = url[0].replace(/[)\]>,.;]+$/g, '')
    try {
      const u = new URL(cleaned)
      if (u.hostname === 'open.spotify.com') {
        const seg = u.pathname.split('/').filter(Boolean)
        if (seg[0]?.startsWith('intl-') && ['album', 'playlist', 'track'].includes(seg[1]) && seg[2]) {
          u.pathname = `/${seg[1]}/${seg[2]}`
          return u.toString()
        }
        if (seg[0] === 'embed' && ['album', 'playlist', 'track'].includes(seg[1]) && seg[2]) {
          u.pathname = `/${seg[1]}/${seg[2]}`
          return u.toString()
        }
      }
    } catch {}
    return cleaned
  }

  return raw
}

module.exports = {
  DESCRIPTION: 'Reproduce una playlist (YouTube / Spotify).',
  ALIASES: ['pl'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message, args) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) return message.reply('Debes unirte a un canal de voz para reproducir música.')

    const me = message.guild.members.me || message.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) return message.reply('No tengo permisos para unirme o hablar en ese canal de voz.')

    const query = normalizeMediaQuery(args.join(' '))
    if (!query) return message.reply('Debes proporcionar un link/URI de playlist.')

    if (isSoundCloudUrl(query)) return message.reply('SoundCloud no está soportado. Usa YouTube o Spotify.')
    if (!isSpotifyPlaylist(query) && !isYoutubePlaylist(query)) {
      return message.reply('Usa una playlist de YouTube (...list=...) o Spotify (https://open.spotify.com/playlist/... o spotify:playlist:...).')
    }

    const music = getMusic(client)
    if (!music) return message.reply('El sistema de música no está inicializado.')

    try {
      const res = await music.play({
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      if (res.isPlaylist) return message.reply(`Playlist agregada: **${res.playlistName || 'Desconocida'}** (**${res.trackCount}** canciones).`)
      return message.reply(`Ahora: **${res.track.title}**`)
    } catch (e) {
      return message.reply(`No pude reproducir la playlist: ${e?.message || e}`)
    }
  }
}
