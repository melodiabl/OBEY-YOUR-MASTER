const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'clearqueue', category: 'Music',
  aliases: ['cq', 'clear'],
  description: 'Limpia la cola de reproducción',
  usage: 'clearqueue',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay sesión de música activa.'), 4096))] }).catch(() => {})
    client.music.clearQueue(message.guild.id)
    message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(obeyUi.limit(obeyUi.owned('🗑️ Cola limpiada.'), 4096))] }).catch(() => {})
  },
}
