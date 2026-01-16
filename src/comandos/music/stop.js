const { getPlayer } = require('../../music/player')

module.exports = {
  DESCRIPTION: 'Detiene la musica y limpia la cola',
  ALIASES: [],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    const player = getPlayer(client)
    const queue = player?.nodes?.get(message.guild.id)
    if (!queue) return message.reply('No hay musica reproduciendose.')

    try {
      queue.delete()
      return message.reply('Musica detenida y cola borrada.')
    } catch {
      return message.reply('No se pudo detener la musica.')
    }
  }
}
