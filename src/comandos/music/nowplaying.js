const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const { replySafe, replyError, replyWarn } = require('../../core/ui/messageKit')
const { buildNowPlayingEmbed } = require('../../music/musicUi')
const { buildMusicControls } = require('../../music/musicComponents')

module.exports = {
  DESCRIPTION: 'Muestra la canción actual + controles.',
  ALIASES: ['np', 'current'],
  async execute (client, message) {
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
      if (!state.currentTrack) {
        return replyWarn(client, message, {
          system: 'music',
          title: 'Sin reproducción',
          lines: ['No hay música reproduciéndose en este momento.']
        })
      }

      const player = music.shoukaku?.players?.get(message.guild.id)
      const position = player ? player.position : 0

      const e = await buildNowPlayingEmbed({ client, guildId: message.guild.id, state, positionMs: position })
      const controls = buildMusicControls({ ownerId: message.author.id, state })
      return replySafe(message, { embeds: [e], components: controls, allowedMentions: { repliedUser: false } })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude obtener el estado',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}

