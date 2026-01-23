const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Ajusta el volumen (0-100).',
  ALIASES: ['vol'],
  async execute (client, message, args) {
    const volume = Number(args?.[0])
    if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
      return replyError(client, message, {
        system: 'music',
        title: 'Volumen inválido',
        reason: 'Usa un valor entre 0 y 100.',
        hint: `Ej: ${Format.inlineCode('volume 60')}`
      })
    }

    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para cambiar volumen.']
      })
    }

    const music = getMusic(client)
    if (!music) return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })

    try {
      await music.setVolume({ guildId: message.guild.id, voiceChannelId: voiceChannel.id, volume })
      return replyEmbed(client, message, {
        system: 'music',
        kind: 'info',
        title: `${Emojis.voice} Volumen actualizado`,
        description: [
          headerLine(Emojis.music, 'Audio'),
          `${Emojis.dot} Volumen: ${Format.bold(`${volume}%`)}`,
          `${Emojis.dot} Progreso: ${Format.progressBar(volume, 100, 15)}`
        ].join('\n'),
        signature: 'Sonido ajustado'
      })
    } catch (e) {
      return replyError(client, message, { system: 'music', title: 'No pude ajustar volumen', reason: e?.message || 'Error desconocido.' })
    }
  }
}
