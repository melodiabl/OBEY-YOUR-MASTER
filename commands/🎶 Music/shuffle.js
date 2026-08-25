const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'shuffle', category: '🎶 Music',
  aliases: ['mix'],
  description: 'Mezcla la cola de reproducción',
  usage: 'shuffle',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.queue?.length) return message.reply({ embeds: [err('La cola está vacía.')] }).catch(() => {})
    await client.music.shuffle(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.shuffle, `Cola mezclada — **${mstate.queue.length}** pistas`)] }).catch(() => {})
  },
}
