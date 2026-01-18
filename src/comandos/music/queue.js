const { getMusic } = require('../../music')

module.exports = {
  DESCRIPTION: 'Muestra la cola de reproduccion',
  ALIASES: ['q', 'list'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    try {
      const voiceChannel = message.member?.voice?.channel
      if (!voiceChannel) return message.reply('Debes estar en un canal de voz.')

      const music = getMusic(client)
      if (!music) return message.reply('El sistema de musica no esta inicializado.')

      const state = await music.getQueue({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      const current = state.currentTrack
      const upcoming = state.queue.slice(0, 10)

      if (!current && upcoming.length === 0) return message.reply('No hay canciones en la cola.')

      let text = '**Cola:**\n'
      if (current) text += `Ahora: **${current.title}**\n`
      if (upcoming.length) {
        text += '\n**Siguientes:**\n'
        text += upcoming.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
      }

      return message.reply(text)
    } catch (e) {
      return message.reply(e?.message || String(e || 'Error desconocido.'))
    }
  }
}
