// /music search estilo Soundy: pestañas 🎵 Pistas / 💿 Álbumes + menú para elegir.
const { EmbedBuilder } = require('discord.js')
const { searchDiscordCatalog, enqueueCatalogItem, itemInfo } = require('../../handlers/discordmusiccatalog')
const { config } = require('../../handlers/music/config')
const { E, err, catEmbed, catRows, addedEmbed } = require('../../handlers/music/playui')

module.exports = {
  name: 'search',
  description: 'Busca canciones y álbumes y elige cuál reproducir',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    { String: { name: 'what_song', description: 'Canción o artista a buscar', required: true } },
  ],

  run: async (client, interaction) => {
    const query = interaction.options.getString('what_song').trim()
    if (!client.music) return interaction.reply({ embeds: [err('Sistema de música no disponible.')], ephemeral: true })

    await interaction.deferReply()
    const results = await searchDiscordCatalog(client, query).catch(() => ({ tracks: [], albums: [] }))
    if (!(results.tracks?.length) && !(results.albums?.length)) {
      return interaction.editReply({ embeds: [err(`Sin resultados para **${query}**`)] }).catch(() => {})
    }

    let tab = 'tracks'
    let items = results.tracks || []
    const fakeMsg = { guild: interaction.guild, author: interaction.user, channel: { id: interaction.channelId } }
    const reply = await interaction.editReply({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'srch') })
    const collector = reply.createMessageComponentCollector({ time: 60_000 })

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'No es tu búsqueda.', ephemeral: true }).catch(() => {})
      if (i.customId.startsWith('srch_tab:')) {
        await i.deferUpdate(); tab = i.customId.split(':')[1]; items = results[tab] || []
        return interaction.editReply({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'srch') }).catch(() => {})
      }
      if (i.customId === 'srch_cancel') { collector.stop('cancel'); return interaction.deleteReply().catch(() => {}) }
      if (i.customId === 'srch_pick') {
        const voiceChannel = i.member?.voice?.channel
        if (!voiceChannel) return i.reply({ embeds: [err('Debes estar en un canal de voz.')], ephemeral: true }).catch(() => {})
        await i.deferUpdate(); collector.stop('picked')
        const item = items[parseInt(i.values?.[0] ?? '0')]
        const info = itemInfo(item)
        try {
          const queued = await enqueueCatalogItem(client, fakeMsg, voiceChannel, item)
          await interaction.editReply({ embeds: [addedEmbed(info, queued, interaction.user.id)], components: [] }).catch(() => {})
        } catch (e) {
          await interaction.editReply({ embeds: [err(e.message || String(e))], components: [] }).catch(() => {})
        }
      }
    })
    collector.on('end', (_, reason) => { if (!['cancel', 'picked'].includes(reason)) interaction.editReply({ components: [] }).catch(() => {}) })
  },
}
