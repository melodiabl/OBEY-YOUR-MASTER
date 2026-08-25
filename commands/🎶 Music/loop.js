const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'loop', category: '🎶 Music',
  aliases: ['repeat', 'l'],
  description: 'Activa el loop: song | queue | off',
  usage: 'loop <song|queue|off>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const arg = (args[0] || '').toLowerCase()
    let mode = 'none'
    if (['song','track','s','t'].includes(arg))  mode = 'track'
    else if (['queue','q','qu'].includes(arg))   mode = 'queue'
    else if (['off','stop','none'].includes(arg)) mode = 'none'
    else return message.reply({ embeds: [err('Uso: `loop song` | `loop queue` | `loop off`')] }).catch(() => {})
    client.music.setLoop(guildId, mode)
    const labels = { none: 'Loop desactivado', track: 'Loop de **canción** activado', queue: 'Loop de **cola** activado' }
    return message.reply({ embeds: [fx(E.loop, labels[mode])] }).catch(() => {})
  },
}
