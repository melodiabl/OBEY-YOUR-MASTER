const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')

function isSpotifyAlbum (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.includes('open.spotify.com/album') || q.startsWith('spotify:album:')
}

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
}

async function playAlbum (music, payload) {
  const q = String(payload.query || '').trim()

  if (isSpotifyAlbum(q)) return await music.play(payload)

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
  PERMISSIONS: [],
  async execute (client, message, args) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) return message.reply('Debes unirte a un canal de voz para reproducir música.')

    const me = message.guild.members.me || message.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) return message.reply('No tengo permisos para unirme o hablar en ese canal de voz.')

    const query = args.join(' ').trim()
    if (!query) return message.reply('Debes proporcionar un link/URI de álbum de Spotify o texto para buscar.')

    if (isSoundCloudUrl(query)) return message.reply('SoundCloud no está soportado. Usa Spotify.')
    if (isUrlLike(query) && !isSpotifyAlbum(query)) {
      return message.reply('Usa un álbum de Spotify (ej: https://open.spotify.com/album/... o spotify:album:...).')
    }

    const music = getMusic(client)
    if (!music) return message.reply('El sistema de música no está inicializado.')

    try {
      const res = await playAlbum(music, {
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      if (res.isPlaylist) return message.reply(`Álbum agregado: **${res.playlistName || 'Desconocido'}** (**${res.trackCount}** canciones).`)
      return message.reply(`Ahora: **${res.track.title}**`)
    } catch (e) {
      return message.reply(`No pude reproducir el álbum: ${e?.message || e}`)
    }
  }
}
