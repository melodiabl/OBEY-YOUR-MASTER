const { EmbedBuilder } = require('discord.js')
const { getLikedSongs, getLikedSongsCount, buildLikedPages, buildLikedRows } = require('../../handlers/music/likes')

module.exports = {
  name: 'likedsongs',
  category: '🎶 Music',
  aliases: ['liked', 'favs', 'favoritos'],
  description: 'Muestra tus canciones favoritas',
  usage: 'likedsongs',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const userId = message.author.id
    const [songs, total] = await Promise.all([getLikedSongs(userId), getLikedSongsCount(userId)])

    if (!songs.length) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setDescription('🤍 Aún no tienes canciones favoritas.\nUsa `like` mientras suena una canción para añadirla.')] }).catch(() => {})
    }

    const pages = buildLikedPages(songs, total, message.author)
    let page = 0
    const sent = await message.reply({ embeds: [pages[page]], components: buildLikedRows(page + 1, pages.length) }).catch(() => null)
    if (!sent || pages.length <= 1) return

    const collector = sent.createMessageComponentCollector({ time: 120000 })
    collector.on('collect', async i => {
      if (i.user.id !== userId) return i.reply({ content: 'Estos no son tus favoritos.', ephemeral: true }).catch(() => {})
      if (i.customId === 'lk_close') { collector.stop(); return i.update({ components: [] }).catch(() => {}) }
      page = i.customId.startsWith('lk_next') ? Math.min(pages.length - 1, page + 1) : Math.max(0, page - 1)
      await i.update({ embeds: [pages[page]], components: buildLikedRows(page + 1, pages.length) }).catch(() => {})
    })
    collector.on('end', () => sent.edit({ components: [] }).catch(() => {}))
  },
}
