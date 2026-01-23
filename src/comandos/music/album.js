const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

function isSpotifyAlbum (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:album:')) return true
  if (q.includes('open.spotify.com/album/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/album/')) return true
  return q.startsWith('https://spotify.link/') ||
    q.startsWith('http://spotify.link/') ||
    q.startsWith('https://spotify.app.link/') ||
    q.startsWith('http://spotify.app.link/')
}

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
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

async function playAlbum (music, payload) {
  const q = String(payload.query || '').trim()
  if (isSpotifyAlbum(q)) return music.play(payload)

  try {
    return await music.play({ ...payload, query: `spsearch:album:${q}` })
  } catch (e) {
    try {
      return await music.play({ ...payload, query: `spsearch:${q}` })
    } catch {
      throw e
    }
  }
}

module.exports = {
  DESCRIPTION: 'Reproduce un álbum (Spotify).',
  ALIASES: ['alb'],
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
        title: 'Falta el álbum',
        reason: 'Debes proporcionar un link/URI de álbum de Spotify o texto para buscar.',
        hint: `${Emojis.dot} Ej: ${Format.inlineCode('album https://open.spotify.com/album/...')}`
      })
    }

    if (isSoundCloudUrl(query)) {
      return replyError(client, message, { system: 'music', title: 'No soportado', reason: 'SoundCloud no está soportado. Usa Spotify.' })
    }
    if (isUrlLike(query) && !isSpotifyAlbum(query)) {
      return replyError(client, message, {
        system: 'music',
        title: 'Link inválido',
        reason: 'Usa un álbum de Spotify (open.spotify.com/album/... o spotify:album:...).'
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })
    }

    try {
      const res = await playAlbum(music, {
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      if (res.isPlaylist) {
        return replyOk(client, message, {
          system: 'music',
          title: `${Emojis.music} Álbum agregado`,
          lines: [
            `${Emojis.dot} Nombre: ${Format.bold(res.playlistName || 'Desconocido')}`,
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
        title: 'No pude reproducir el álbum',
        reason: e?.message || String(e || 'Error desconocido.')
      })
    }
  }
}

