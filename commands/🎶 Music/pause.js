const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'pause', category: '🎶 Music',
  aliases: ['break'],
  description: 'Pausa o reanuda la reproducción',
  usage: 'pause',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const paused = await client.music.pause(guildId).catch(() => null)
    return message.reply({ embeds: [fx(paused ? E.pause : E.play, paused ? 'Reproducción pausada' : 'Reproducción reanudada')] }).catch(() => {})
  },
}
