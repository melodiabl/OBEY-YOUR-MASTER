const { EmbedBuilder } = require('discord.js')
const { getLikedSongs, getLikedSongsCount, buildLikedPages, buildLikedRows } = require('../../handlers/music/likes')

module.exports = {
  name: 'lista',
  description: 'Muestra tus canciones favoritas',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [],
  run: async (client, interaction) => {
    await interaction.deferReply()
    const userId = interaction.user.id
    const [songs, total] = await Promise.all([getLikedSongs(userId), getLikedSongsCount(userId)])

    if (!songs.length) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setDescription('🤍 Aún no tienes canciones favoritas.\nUsa `/favoritos like` mientras suena una canción para añadirla.')] })
    }

    const pages = buildLikedPages(songs, total, interaction.user)
    let page = 0
    await interaction.editReply({ embeds: [pages[page]], components: buildLikedRows(page + 1, pages.length) })

    if (pages.length <= 1) return
    const msg = await interaction.fetchReply().catch(() => null)
    if (!msg) return
    const collector = msg.createMessageComponentCollector({ time: 120000 })
    collector.on('collect', async i => {
      if (i.user.id !== userId) return i.reply({ content: 'Estos no son tus favoritos.', ephemeral: true }).catch(() => {})
      if (i.customId === 'lk_close') { collector.stop(); return i.update({ components: [] }).catch(() => {}) }
      page = i.customId.startsWith('lk_next') ? Math.min(pages.length - 1, page + 1) : Math.max(0, page - 1)
      await i.update({ embeds: [pages[page]], components: buildLikedRows(page + 1, pages.length) }).catch(() => {})
    })
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}))
  },
}
