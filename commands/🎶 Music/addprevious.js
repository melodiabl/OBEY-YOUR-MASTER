const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'addprevious', category: '🎶 Music',
  aliases: ['ap', 'prev'],
  description: 'Vuelve a la canción anterior',
  usage: 'playprevious',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.history?.length) return message.reply({ embeds: [err('No hay canción anterior.')] }).catch(() => {})
    await client.music.previous(guildId).catch(() => {})
    return message.reply({ embeds: [fx(E.previous, 'Reproduciendo la canción anterior')] }).catch(() => {})
  },
}
