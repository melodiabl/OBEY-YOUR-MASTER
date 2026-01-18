const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')

function isSpotifyPlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.includes('open.spotify.com/playlist') || q.startsWith('spotify:playlist:')
}

function isYoutubePlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.includes('youtube.com/playlist')) return true
  if (q.includes('youtube.com/watch') && q.includes('list=')) return true
  if (q.includes('youtu.be/') && q.includes('list=')) return true
  return false
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

    const query = args.join(' ').trim()
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
