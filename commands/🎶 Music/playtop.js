const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'playtop', category: '🎶 Music',
  aliases: ['pt', 'playnext'],
  description: 'Añade una canción al inicio de la cola',
  usage: 'playtop <canción>',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message, args) => {
    const query = args.join(' ')
    if (!query) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Ingresa el nombre de la canción.')] }).catch(() => {})
    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Únete a un canal de voz.')] }).catch(() => {})
    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('🔎 Buscando...')] })
    try {
      const player = await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
      const result = await client.music.search(query, message.author)
      if (!result?.tracks?.length) return loading.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No se encontraron resultados.')] }).catch(() => {})
      const state  = client.music.getState(message.guild.id)
      const track  = result.tracks[0]
      state.queue.unshift(track)
      if (!state.currentTrack) await client.music._playNext(message.guild.id, player)
      const info = track.info || track
      loading.edit({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`⬆️ **${info.title || query}** añadida al inicio de la cola.`)] }).catch(() => {})
    } catch (e) {
      loading.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message || e}`)] }).catch(() => {})
    }
  },
}
