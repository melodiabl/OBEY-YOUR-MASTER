const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Reanuda la música.',
  ALIASES: ['unpause'],
  async execute (client, message) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para reanudar.']
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })
    }

    try {
      await music.resume({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      return replyOk(client, message, { system: 'music', title: 'Reanudado', lines: ['Música reanudada.'] })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude reanudar',
        reason: e?.message || 'Error desconocido.',
        hint: `Tip: prueba con ${Format.inlineCode('pause')}.`
      })
    }
  }
}
