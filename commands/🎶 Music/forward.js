const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'forward', category: '🎶 Music',
  aliases: ['ff'],
  description: 'Avanza N segundos en la canción actual',
  usage: 'forward <segundos>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const secs = parseInt(args[0]) || 10
    const player = client.shoukaku?.players?.get(guildId)
    const pos = (player?.position || 0) + secs * 1000
    await client.music.seek(guildId, pos).catch(() => {})
    return message.reply({ embeds: [fx(E.forward, `Adelantado **${secs}s**`)] }).catch(() => {})
  },
}
