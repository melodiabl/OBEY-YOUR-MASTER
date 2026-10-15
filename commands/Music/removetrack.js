const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'removetrack', category: 'Music',
  aliases: ['remove', 'rm', 'del'],
  description: 'Elimina una canción de la cola por su posición',
  usage: 'removetrack <posición>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.queue?.length)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ La cola está vacía.'), 4096))] }).catch(() => {})
    const pos = parseInt(args[0])
    if (isNaN(pos) || pos < 1)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Ingresa una posición válida.'), 4096))] }).catch(() => {})
    const removed = await client.music.remove(guildId, pos).catch(e => {
      message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message}`, 4096))] }).catch(() => {})
      return null
    })
    if (removed) {
      const info = removed.info || removed
      message.reply({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(obeyUi.limit(`${obeyUi.markup("icon.delete")} Eliminado: **${info.title || '?'}**`, 4096))] }).catch(() => {})
    }
  },
}
