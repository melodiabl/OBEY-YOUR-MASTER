const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'resume', category: '🎶 Music',
  aliases: ['unpause', 'continue'],
  description: 'Reanuda la reproducción',
  usage: 'resume',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    if (!mstate.paused) return message.reply({ embeds: [err('La música ya está reproduciéndose.')] }).catch(() => {})
    await client.music.pause(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.play, 'Reproducción reanudada')] }).catch(() => {})
  },
}
