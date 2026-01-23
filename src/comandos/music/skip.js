const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Salta la canción actual',
  ALIASES: ['s'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  async execute (client, message) {
    try {
      const voiceChannel = message.member?.voice?.channel
      if (!voiceChannel) {
        return replyWarn(client, message, {
          system: 'music',
          title: 'Conéctate a un canal de voz',
          lines: [`${Emojis.dot} Debes estar en un canal de voz.`]
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

      const res = await music.skip({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      if (res.ended) {
        return replyOk(client, message, {
          system: 'music',
          title: `${Emojis.skip} Saltado`,
          lines: [`${Emojis.dot} La cola terminó.`],
          signature: 'Fin de sesión'
        })
      }

      return replyOk(client, message, {
        system: 'music',
        title: `${Emojis.skip} Saltado`,
        lines: [`${Emojis.dot} Ahora: ${Format.bold(res.skippedTo.title)}`],
        signature: 'Siguiente track'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude saltar',
        reason: e?.message || String(e || 'Error desconocido.')
      })
    }
  }
}

