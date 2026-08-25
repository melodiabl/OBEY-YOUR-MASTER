const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'autoplay', category: '🎶 Music',
  aliases: ['ap'],
  description: 'Activa o desactiva el autoplay',
  usage: 'autoplay',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay sesión de música activa.')] }).catch(() => {})
    state.autoplay = !state.autoplay
    message.reply({ embeds: [new EmbedBuilder()
      .setColor(state.autoplay ? 0x57F287 : 0x4f545c)
      .setDescription(state.autoplay ? '🎲 **Autoplay activado**' : '🔇 **Autoplay desactivado**')] }).catch(() => {})
  },
}
