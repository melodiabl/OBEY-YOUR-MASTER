const { getPlayer } = require('../../music/player')

module.exports = {
  DESCRIPTION: 'Salta la cancion actual',
  ALIASES: ['s'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    const player = getPlayer(client)
    const queue = player?.nodes?.get(message.guild.id)
    if (!queue || !queue.node.isPlaying()) return message.reply('No hay musica reproduciendose.')

    const ok = queue.node.skip()
    if (!ok) return message.reply('No se pudo saltar la cancion.')
    return message.reply('Cancion saltada.')
  }
}
