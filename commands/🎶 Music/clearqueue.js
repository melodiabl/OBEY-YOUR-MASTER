const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'clearqueue', category: '🎶 Music',
  aliases: ['cq', 'clear'],
  description: 'Limpia la cola de reproducción',
  usage: 'clearqueue',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay sesión de música activa.')] }).catch(() => {})
    state.queue = []
    message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription('🗑️ Cola limpiada.')] }).catch(() => {})
  },
}
