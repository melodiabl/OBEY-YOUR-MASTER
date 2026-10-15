const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'clearfilter', category: 'Filter',
  aliases: ['cleareq', 'nofilter', 'cf'],
  description: 'Elimina todos los filtros activos',
  usage: 'clearfilter',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] }).catch(() => {})
    await client.music.setFilter(guildId, 'off').catch(() => {})
    message.react(obeyUi.reaction('✅')).catch(() => {})
  },
}
