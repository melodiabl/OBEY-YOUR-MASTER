const { fx, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'stop', category: '🎶 Music',
  aliases: ['leave', 'disconnect', 'dis', 'votestop'],
  description: 'Detiene la música y desconecta el bot',
  usage: 'stop',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    await client.music?.stop(message.guild.id).catch(() => {})
    return message.reply({ embeds: [fx(E.stop, 'Reproducción detenida y bot desconectado.')] }).catch(() => {})
  },
}
