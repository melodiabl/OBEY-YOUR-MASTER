const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'removetrack', category: '🎶 Music',
  aliases: ['remove', 'rm', 'del'],
  description: 'Elimina una canción de la cola por su posición',
  usage: 'removetrack <posición>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.queue?.length)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ La cola está vacía.')] }).catch(() => {})
    const pos = parseInt(args[0])
    if (isNaN(pos) || pos < 1)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Ingresa una posición válida.')] }).catch(() => {})
    const removed = await client.music.remove(guildId, pos).catch(e => {
      message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message}`)] }).catch(() => {})
      return null
    })
    if (removed) {
      const info = removed.info || removed
      message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`🗑️ Eliminado: **${info.title || '?'}**`)] }).catch(() => {})
    }
  },
}
