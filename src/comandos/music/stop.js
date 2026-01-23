const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Detiene la música y limpia la cola',
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

      await music.stop({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      return replyOk(client, message, {
        system: 'music',
        title: `${Emojis.stop} Detenido`,
        lines: [`${Emojis.dot} Música detenida y cola borrada.`],
        signature: 'Sesión cerrada'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude detener la música',
        reason: e?.message || String(e || 'Error desconocido.')
      })
    }
  }
}

