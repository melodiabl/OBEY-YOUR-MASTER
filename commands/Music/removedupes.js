const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'removedupes', category: 'Music',
  aliases: ['dedup'],
  description: 'Elimina duplicados de la cola',
  usage: 'removedupes',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.queue?.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ La cola está vacía.')] }).catch(() => {})
    const removed = client.music.removeDuplicates(message.guild.id)
    message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`🗑️ Eliminados **${removed}** duplicados.`)] }).catch(() => {})
  },
}
