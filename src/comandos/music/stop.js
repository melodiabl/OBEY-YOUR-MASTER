const { getMusic } = require('../../music')

module.exports = {
  DESCRIPTION: 'Detiene la musica y limpia la cola',
  ALIASES: [],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    try {
      const voiceChannel = message.member?.voice?.channel
      if (!voiceChannel) return message.reply('Debes estar en un canal de voz.')

      const music = getMusic(client)
      if (!music) return message.reply('El sistema de musica no esta inicializado.')

      await music.stop({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      return message.reply('Musica detenida y cola borrada.')
    } catch (e) {
      return message.reply(e?.message || String(e || 'No se pudo detener la musica.'))
    }
  }
}
