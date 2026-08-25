const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'unshuffle', category: '🎶 Music',
  aliases: [],
  description: 'Reorganiza la cola (shuffle de nuevo)',
  usage: 'unshuffle',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.queue?.length) return message.reply({ embeds: [err('La cola está vacía.')] }).catch(() => {})
    await client.music.shuffle(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.shuffle, `Cola reorganizada — **${mstate.queue.length}** pistas`)] }).catch(() => {})
  },
}
