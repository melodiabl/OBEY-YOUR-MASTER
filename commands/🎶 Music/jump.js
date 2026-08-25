const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'jump', category: '🎶 Music',
  aliases: ['skipto'],
  description: 'Salta a una posición específica de la cola',
  usage: 'jump <posición>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const pos = parseInt(args[0])
    if (isNaN(pos) || pos < 1) return message.reply({ embeds: [err('Ingresa una posición válida.')] }).catch(() => {})
    let failed = false
    await client.music.jump(guildId, pos).catch(e => { failed = true; message.reply({ embeds: [err(e.message)] }).catch(() => {}) })
    if (!failed) return message.reply({ embeds: [fx(E.skip, `Saltado a la pista **#${pos}** de la cola`)] }).catch(() => {})
  },
}
