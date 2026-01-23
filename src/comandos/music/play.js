const { getMusic } = require('../../music')
const { isSoundCloudUrl, getMemberVoiceChannel, botHasVoicePerms } = require('../../utils/voiceChecks')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Reproduce música en tu canal de voz (YouTube / Spotify).',
  ALIASES: ['p'],
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

    const query = String(args.join(' ') || '').trim()
    if (!query) {
      return replyError(client, message, {
        system: 'music',
        title: 'Falta el enlace/búsqueda',
        reason: 'Debes proporcionar un enlace o texto para buscar.',
        hint: `${Emojis.dot} Ej: ${Format.inlineCode('play never gonna give you up')}`
      })
    }

    if (isSoundCloudUrl(query)) {
      return replyError(client, message, {
        system: 'music',
        title: 'No soportado',
        reason: 'SoundCloud no está soportado. Usa YouTube o Spotify.'
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, {
        system: 'music',
        title: 'Sistema de música apagado',
        reason: 'El sistema de música no está inicializado.'
      })
    }

    try {
      const res = await music.play({
        guildId: message.guild.id,
        guild: message.guild,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id,
        requestedBy: message.author,
        query
      })

      const title = res?.track?.title || 'Track'
      return replyOk(client, message, {
        system: 'music',
        title: res.started ? `${Emojis.play} Reproduciendo` : `${Emojis.music} En cola`,
        lines: [
          `${Emojis.dot} **Canal:** ${voiceChannel}`,
          `${Emojis.dot} **Track:** ${Format.bold(title)}`
        ],
        signature: 'Música en marcha'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude reproducir',
        reason: e?.message || String(e || 'Error desconocido.'),
        hint: 'Prueba con otro enlace o una búsqueda más simple.'
      })
    }
  }
}

