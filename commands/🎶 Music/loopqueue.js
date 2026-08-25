const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'loopqueue', category: '🎶 Music',
  aliases: ['lq', 'repeatqueue'],
  description: 'Activa el loop de cola',
  usage: 'loopqueue',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const mode = mstate.loop === 'queue' ? 'none' : 'queue'
    client.music.setLoop(guildId, mode)
    return message.reply({ embeds: [fx(E.loop, mode === 'queue' ? 'Loop de **cola** activado' : 'Loop desactivado')] }).catch(() => {})
  },
}
