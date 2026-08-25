const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'loopsong', category: '🎶 Music',
  aliases: ['looptrack', 'ls'],
  description: 'Activa el loop de la canción actual',
  usage: 'loopsong',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const mode = mstate.loop === 'track' ? 'none' : 'track'
    client.music.setLoop(guildId, mode)
    return message.reply({ embeds: [fx(E.loop, mode === 'track' ? 'Loop de **canción** activado' : 'Loop desactivado')] }).catch(() => {})
  },
}
