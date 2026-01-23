const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra la cola de reproducción',
  ALIASES: ['q', 'list'],
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

      const state = await music.getQueue({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      const current = state.currentTrack
      const upcoming = state.queue.slice(0, 10)

      if (!current && upcoming.length === 0) {
        return replyWarn(client, message, {
          system: 'music',
          title: 'Cola vacía',
          lines: [`${Emojis.dot} No hay canciones en la cola.`]
        })
      }

      const lines = []
      if (current) lines.push(`${Emojis.play} **Ahora:** ${Format.bold(current.title)}`)
      if (upcoming.length) {
        lines.push(Format.softDivider(20))
        lines.push(`${Emojis.queue} **Siguientes:**`)
        lines.push(upcoming.map((t, i) => `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${t.title}`).join('\n'))
      }

      return replyEmbed(client, message, {
        system: 'music',
        kind: 'info',
        title: `${Emojis.music} Cola`,
        description: [headerLine(Emojis.music, voiceChannel.name), ...lines].join('\n'),
        signature: 'Sigue sonando'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude obtener la cola',
        reason: e?.message || String(e || 'Error desconocido.')
      })
    }
  }
}

