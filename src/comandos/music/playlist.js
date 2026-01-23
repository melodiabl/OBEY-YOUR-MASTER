const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

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
  async execute (client, message, args) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: [`${Emojis.dot} Debes unirte a un canal de voz para reproducir música.`]
      })
    }

    const me = message.guild.members.me || message.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return replyError(client, message, {
        system: 'music',
        title: 'Sin permisos de voz',
        reason: 'No tengo permisos para unirme o hablar en ese canal de voz.'
      })
    }

    const query = normalizeMediaQuery(args.join(' '))
    if (!query) {
      return replyError(client, message, {
        system: 'music',
        title: 'Falta la playlist',
        reason: 'Debes proporcionar un link/URI de playlist.',
        hint: `${Emojis.dot} Spotify o YouTube (list=...)`
      })
    }

    if (isSoundCloudUrl(query)) {
      return replyError(client, message, { system: 'music', title: 'No soportado', reason: 'SoundCloud no está soportado. Usa YouTube o Spotify.' })
    }
    if (!isSpotifyPlaylist(query) && !isYoutubePlaylist(query)) {
      return replyError(client, message, {
        system: 'music',
        title: 'Link inválido',
        reason: 'Usa una playlist de YouTube (...list=...) o Spotify (open.spotify.com/playlist/... o spotify:playlist:...).'
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })
    }

    try {
      const res = await music.play({
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      if (res.isPlaylist) {
        return replyOk(client, message, {
          system: 'music',
          title: `${Emojis.music} Playlist agregada`,
          lines: [
            `${Emojis.dot} Nombre: ${Format.bold(res.playlistName || 'Desconocida')}`,
            `${Emojis.dot} Tracks: ${Format.inlineCode(res.trackCount)}`
          ],
          signature: 'A la cola'
        })
      }

      return replyOk(client, message, {
        system: 'music',
        title: `${Emojis.play} Reproduciendo`,
        lines: [`${Emojis.dot} Track: ${Format.bold(res.track.title)}`]
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude reproducir la playlist',
        reason: e?.message || String(e || 'Error desconocido.')
      })
    }
  }
}

