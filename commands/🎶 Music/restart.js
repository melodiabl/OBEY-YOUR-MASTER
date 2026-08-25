const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'restart', category: '🎶 Music',
  aliases: ['replay', 'beginning'],
  description: 'Reinicia la canción actual desde el principio',
  usage: 'restart',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    await client.music.seek(guildId, 0).catch(() => {})
    return message.reply({ embeds: [fx(E.previous, 'Canción reiniciada desde el principio')] }).catch(() => {})
  },
}
