const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'removedupes', category: '🎶 Music',
  aliases: ['dedup'],
  description: 'Elimina duplicados de la cola',
  usage: 'removedupes',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.queue?.length) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ La cola está vacía.')] }).catch(() => {})
    const seen = new Set()
    const before = state.queue.length
    state.queue = state.queue.filter(t => {
      const key = (t.info || t).uri || (t.info || t).title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const removed = before - state.queue.length
    message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`🗑️ Eliminados **${removed}** duplicados.`)] }).catch(() => {})
  },
}
