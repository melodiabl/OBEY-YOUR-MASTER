const { getPlayer } = require('../../music/player')

module.exports = {
  DESCRIPTION: 'Muestra la cola de reproduccion',
  ALIASES: ['q', 'list'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute (client, message) {
    const player = getPlayer(client)
    const queue = player?.nodes?.get(message.guild.id)
    if (!queue) return message.reply('No hay cola activa.')

    const current = queue.currentTrack
    const upcoming = queue.tracks.toArray().slice(0, 10)

    if (!current && upcoming.length === 0) return message.reply('No hay canciones en la cola.')

    let text = '**Cola:**\n'
    if (current) text += `Ahora: **${current.title}**\n`
    if (upcoming.length) {
      text += '\n**Siguientes:**\n'
      text += upcoming.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
    }

    return message.reply(text)
  }
}
