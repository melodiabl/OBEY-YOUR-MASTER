const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Mezcla la cola de canciones.',
  ALIASES: ['mix'],
  async execute (client, message) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para mezclar.']
      })
    }

    const music = getMusic(client)
    if (!music) return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })

    try {
      const { count } = await music.shuffle({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      if (count < 2) {
        return replyWarn(client, message, {
          system: 'music',
          title: 'Nada para mezclar',
          lines: ['No hay suficientes canciones en la cola.']
        })
      }
      return replyOk(client, message, { system: 'music', title: 'Mezclado', lines: [`Se mezclaron ${Format.bold(count)} canciones.`] })
    } catch (e) {
      return replyError(client, message, { system: 'music', title: 'No pude mezclar', reason: e?.message || 'Error desconocido.' })
    }
  }
}
