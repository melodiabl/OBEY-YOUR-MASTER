const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'voteskip', category: '🎶 Music',
  aliases: ['vskip'],
  description: 'Vota para saltar la canción actual',
  usage: 'voteskip',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    await client.music.skip(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.skip, 'Canción saltada')] }).catch(() => {})
  },
}
