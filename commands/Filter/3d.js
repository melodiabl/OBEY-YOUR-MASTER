const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: '3d', category: 'Filter',
  aliases: ["8d"],
  description: 'Activa/desactiva efecto 3D/8D',
  usage: '3d',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] }).catch(() => {})
    const next = mstate.filter === '8d' ? 'off' : '8d'
    await client.music.setFilter(guildId, next).catch(e =>
      message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message}`, 4096))] }).catch(() => {})
    )
    message.react(obeyUi.reaction(next === 'off' ? '✅' : '🎛️')).catch(() => {})
  },
}
