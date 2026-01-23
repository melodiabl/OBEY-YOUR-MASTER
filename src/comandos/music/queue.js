const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replySafe, replyError, replyWarn } = require('../../core/ui/messageKit')
const { buildQueueEmbed } = require('../../music/musicUi')
const { buildMusicControls } = require('../../music/musicComponents')

module.exports = {
  DESCRIPTION: 'Muestra la cola de reproducción (premium).',
  ALIASES: ['q', 'list'],
  async execute (client, message, args) {
    const music = getMusic(client)
    if (!music) {
      return replyError(client, message, {
        system: 'music',
        title: 'Sistema de música apagado',
        reason: 'El sistema de música no está inicializado.'
      })
    }

    const page = Number(args?.[0] || 1)
    const safePage = Number.isFinite(page) ? Math.max(1, Math.min(25, page)) : 1

    try {
      const state = await music.getQueue({ guildId: message.guild.id })
      const player = music.shoukaku?.players?.get(message.guild.id)
      const position = player ? player.position : 0

      const e = await buildQueueEmbed({ client, guildId: message.guild.id, state, positionMs: position, page: safePage, pageSize: 8 })
      const controls = state.currentTrack ? buildMusicControls({ ownerId: message.author.id, state }) : []
      return replySafe(message, { embeds: [e], components: controls, allowedMentions: { repliedUser: false } })
    } catch (e) {
      return replyError(client, message, {
        system: 'music',
        title: 'No pude obtener la cola',
        reason: e?.message || String(e || 'Error desconocido.'),
        hint: `${Emojis.dot} Tip: usa ${Format.inlineCode('play <búsqueda>')}`
      })
    }
  }
}

