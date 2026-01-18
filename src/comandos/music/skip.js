const { getMusic } = require('../../music')

module.exports = {
  DESCRIPTION: 'Salta la cancion actual',
  ALIASES: ['s'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    try {
      const voiceChannel = message.member?.voice?.channel
      if (!voiceChannel) return message.reply('Debes estar en un canal de voz.')

      const music = getMusic(client)
      if (!music) return message.reply('El sistema de musica no esta inicializado.')

      const res = await music.skip({ guildId: message.guild.id, voiceChannelId: voiceChannel.id })
      if (res.ended) return message.reply('Cancion saltada. La cola termino.')
      return message.reply(`Cancion saltada. Ahora: **${res.skippedTo.title}**`)
    } catch (e) {
      return message.reply(e?.message || String(e || 'Error desconocido.'))
    }
  }
}
