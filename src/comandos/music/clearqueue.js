const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Limpia la cola (mantiene la actual).',
  ALIASES: ['cq'],
  async execute (client, message) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, { system: 'music', title: 'Conéctate a un canal de voz', lines: ['Debes estar en un canal de voz.'] })
    }

    const music = getMusic(client)
    if (!music) return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })

    try {
      const { cleared, state } = await music.clearQueue({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
      return replyOk(client, message, { system: 'music', title: 'Cola limpiada', lines: [`Eliminadas: ${Format.bold(cleared)}${suffix}.`] })
    } catch (e) {
      return replyError(client, message, { system: 'music', title: 'No pude limpiar la cola', reason: e?.message || 'Error desconocido.' })
    }
  }
}
