const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')

function parseTimeToMs (timeStr) {
  if (!timeStr) return null
  if (/^\d+$/.test(timeStr)) return parseInt(timeStr) * 1000

  const parts = timeStr.split(':').reverse()
  let ms = 0
  if (parts[0]) ms += parseInt(parts[0]) * 1000
  if (parts[1]) ms += parseInt(parts[1]) * 60 * 1000
  if (parts[2]) ms += parseInt(parts[2]) * 60 * 60 * 1000
  return ms
}

module.exports = {
  DESCRIPTION: 'Salta a un punto específico de la canción (ej: 1:30 o 90).',
  ALIASES: [],
  async execute (client, message, args) {
    const timeStr = String(args?.[0] || '').trim()
    if (!timeStr) {
      return replyError(client, message, {
        system: 'music',
        title: 'Falta el tiempo',
        reason: 'Indica segundos (90) o formato 1:30.',
        hint: `Ej: ${Format.inlineCode('seek 1:30')}`
      })
    }

    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para usar seek.']
      })
    }

    const ms = parseTimeToMs(timeStr)
    if (isNaN(ms) || ms === null) {
      return replyError(client, message, {
        system: 'music',
        title: 'Formato inválido',
        reason: 'Usa segundos (90) o formato 1:30.'
      })
    }

    const music = getMusic(client)
    if (!music) return replyError(client, message, { system: 'music', title: 'Sistema apagado', reason: 'El sistema de música no está inicializado.' })

    try {
      const state = await music.nowPlaying({ guildId: message.guild.id })
      if (!state.currentTrack) {
        return replyWarn(client, message, { system: 'music', title: 'Sin reproducción', lines: ['No hay ninguna canción reproduciéndose.'] })
      }
      if (ms > state.currentTrack.duration) {
        return replyError(client, message, { system: 'music', title: 'Tiempo fuera de rango', reason: 'Excede la duración de la canción.' })
      }

      await music.seek({ guildId: message.guild.id, voiceChannelId: voiceChannel.id, position: ms })
      return replyOk(client, message, { system: 'music', title: 'Seek', lines: [`Saltado a ${Format.bold(timeStr)}`] })
    } catch (e) {
      return replyError(client, message, { system: 'music', title: 'No pude hacer seek', reason: e?.message || 'Error desconocido.' })
    }
  }
}
