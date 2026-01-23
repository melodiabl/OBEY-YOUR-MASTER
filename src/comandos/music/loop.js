const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Configura el loop (none|track|queue).',
  ALIASES: ['repeat'],
  async execute (client, message, args) {
    const mode = String(args?.[0] || '').trim().toLowerCase()
    const valid = new Set(['none', 'track', 'queue'])
    if (!valid.has(mode)) {
      return replyError(client, message, {
        system: 'music',
        title: 'Modo inválido',
        reason: 'Usa: none | track | queue.',
        hint: `Ej: ${Format.inlineCode('loop track')}`
      })
    }

    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para configurar loop.']
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })
    }

    try {
      await music.setLoop({ guildId: message.guild.id, voiceChannelId: voiceChannel.id, mode })
      const label = mode === 'none' ? 'Desactivado' : mode === 'track' ? 'Canción actual' : 'Cola completa'
      return replyOk(client, message, { system: 'music', title: 'Loop actualizado', lines: [`Modo: ${Format.bold(label)}`] })
    } catch (e) {
      return replyError(client, message, { system: 'music', title: 'No pude actualizar loop', reason: e?.message || 'Error desconocido.' })
    }
  }
}
