const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'clearfilter', category: '👀 Filter',
  aliases: ['cleareq', 'nofilter', 'cf'],
  description: 'Elimina todos los filtros activos',
  usage: 'clearfilter',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    await client.music.setFilter(guildId, 'off').catch(() => {})
    message.react('✅').catch(() => {})
  },
}
