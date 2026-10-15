const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'playtop', category: 'Music',
  aliases: ['pt', 'playnext'],
  description: 'Añade una canción al inicio de la cola',
  usage: 'playtop <canción>',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message, args) => {
    const query = args.join(' ')
    if (!query) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Ingresa el nombre de la canción.'), 4096))] }).catch(() => {})
    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Únete a un canal de voz.'), 4096))] }).catch(() => {})
    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(obeyUi.owned('🔎 Buscando...'), 4096))] })
    try {
      const player = await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
      const result = await client.music.search(query, message.author, { guildId: message.guild.id })
      if (!result?.tracks?.length) return loading.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No se encontraron resultados.')] }).catch(() => {})
      const state  = client.music.getState(message.guild.id)
      const track  = result.tracks[0]
      await client.music.enqueue(message.guild.id, [track], { front: true })
      const info = track.info || track
      loading.edit({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(obeyUi.limit(`${obeyUi.markup("icon.arrow-up")} **${info.title || query}** añadida al inicio de la cola.`, 4096))] }).catch(() => {})
    } catch (e) {
      loading.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message || e}`, 4096))] }).catch(() => {})
    }
  },
}
