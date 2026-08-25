const { fx, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'stoploop', category: '🎶 Music',
  aliases: ['noloop', 'norepeat'],
  description: 'Desactiva el loop',
  usage: 'stoploop',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    client.music?.setLoop(message.guild.id, 'none')
    return message.reply({ embeds: [fx(E.loop, 'Loop desactivado')] }).catch(() => {})
  },
}
