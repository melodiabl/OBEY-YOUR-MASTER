const { getMusic } = require('../../music')
const { getMemberVoiceChannel } = require('../../utils/voiceChecks')
const { formatDuration } = require('../../utils/timeFormat')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra la canción actual.',
  ALIASES: ['np', 'current'],
  async execute (client, message) {
    const voiceChannel = getMemberVoiceChannel(message.member)
    if (!voiceChannel) {
      return replyWarn(client, message, {
        system: 'music',
        title: 'Conéctate a un canal de voz',
        lines: ['Debes estar en un canal de voz para ver el now playing.']
      })
    }

    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, {
        system: 'music',
        title: 'Sistema apagado',
        reason: 'El sistema de música no está inicializado.'
      })
    }

    try {
      const state = await music.nowPlaying({ guildId: message.guild.id })
      const current = state.currentTrack
      if (!current) {
        return replyWarn(client, message, {
          system: 'music',
          title: 'Sin reproducción',
          lines: ['No hay música reproduciéndose en este momento.']
        })
      }

      const player = music.shoukaku?.players?.get(message.guild.id)
      const position = player ? player.position : 0
      const statusText = state.isPaused ? 'Pausado' : 'Reproduciendo'
      const statusEmoji = state.isPaused ? Emojis.idle : Emojis.online

      return replyEmbed(client, message, {
        system: 'music',
        kind: 'info',
        title: `${statusEmoji} ${statusText}`,
        description: [
          headerLine(Emojis.music, 'Now Playing'),
          Format.h3(`[${current.title}](${current.uri})`),
          Format.softDivider(20),
          `${Emojis.dot} ${Emojis.owner} Autor: ${Format.inlineCode(current.author)}`,
          `${Emojis.dot} ${Emojis.member} Pedido por: <@${current.requestedBy.id}>`,
          `${Emojis.dot} ${Emojis.loading} Tiempo: ${Format.inlineCode(`${formatDuration(position)} / ${formatDuration(current.duration)}`)}`,
          `${Emojis.dot} ${Emojis.stats} Progreso: ${Format.progressBar(position, current.duration, 15)}`
        ].join('\n'),
        thumbnail: current.thumbnail || null,
        signature: 'Música en marcha'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude obtener el estado',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
