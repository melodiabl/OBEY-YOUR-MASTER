const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'china', category: '👀 Filter',
  aliases: [],
  description: 'Activa Nightcore (china)',
  usage: 'china',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    const next = mstate.filter === 'nightcore' ? 'off' : 'nightcore'
    await client.music.setFilter(guildId, next).catch(e =>
      message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message}`)] }).catch(() => {})
    )
    message.react(next === 'off' ? '✅' : '🎛️').catch(() => {})
  },
}
