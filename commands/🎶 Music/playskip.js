const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playskip', category: '🎶 Music',
  aliases: ['ps'],
  description: 'Reproduce inmediatamente saltando la canción actual',
  usage: 'playskip <canción>',
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
      await client.music.skip(message.guild.id).catch(() => {})
      const info = track.info || track
      loading.edit({ embeds: [new EmbedBuilder().setColor(0x57F287).setDescription(`▶️ Reproduciendo ahora: **${info.title || query}**`)] }).catch(() => {})
    } catch (e) {
      loading.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message || e}`)] }).catch(() => {})
    }
  },
}
