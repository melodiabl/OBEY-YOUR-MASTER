const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'forceskip', category: '🎶 Music',
  aliases: ['fskip'],
  description: 'Salta la canción actual',
  usage: 'skip',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const next = mstate.queue[0]?.info || mstate.queue[0]
    await client.music.skip(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.skip, next?.title ? `Saltada (forzado) — ahora suena **${next.title.slice(0, 60)}**` : 'Canción saltada (forzado)')] }).catch(() => {})
  },
}
