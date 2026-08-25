const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'tremolo', category: '👀 Filter',
  aliases: ["trem"],
  description: 'Activa/desactiva Tremolo',
  usage: 'tremolo',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    const next = mstate.filter === 'tremolo' ? 'off' : 'tremolo'
    await client.music.setFilter(guildId, next).catch(e =>
      message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message}`)] }).catch(() => {})
    )
    message.react(next === 'off' ? '✅' : '🎛️').catch(() => {})
  },
}
