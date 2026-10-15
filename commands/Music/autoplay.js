const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'autoplay', category: 'Music',
  aliases: ['ap'],
  description: 'Activa o desactiva el autoplay',
  usage: 'autoplay',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay sesión de música activa.'), 4096))] }).catch(() => {})
    state.autoplay = !state.autoplay
    message.reply({ embeds: [new EmbedBuilder()
      .setColor(state.autoplay ? 0x57F287 : 0x4f545c)
      .setDescription(obeyUi.limit(state.autoplay ? obeyUi.owned('🎲 **Autoplay activado**') : obeyUi.owned('🔇 **Autoplay desactivado**'), 4096))] }).catch(() => {})
  },
}
