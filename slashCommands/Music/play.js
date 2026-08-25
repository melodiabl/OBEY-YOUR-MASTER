// /music play estilo Soundy: muestra resultados (🎵 Pistas / 💿 Álbumes) para elegir; URL directa.
const { EmbedBuilder } = require('discord.js')
const { searchDiscordCatalog, enqueueCatalogItem, itemInfo } = require('../../handlers/discordmusiccatalog')
const { config } = require('../../handlers/music/config')
const { E, err, catEmbed, catRows, addedEmbed, playlistAdded } = require('../../handlers/music/playui')

const isUrl = s => /^https?:\/\//i.test(s)

module.exports = {
  name: 'play',
  description: 'Busca y reproduce una canción, álbum, playlist o URL',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    { String: { name: 'what_song', description: 'Canción, artista o URL de Spotify/YouTube', required: true } },
  ],

  run: async (client, interaction) => {
    const query = interaction.options.getString('what_song').trim()
    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel) return interaction.reply({ embeds: [err('Debes estar en un canal de voz.')], ephemeral: true })
    if (!client.music) return interaction.reply({ embeds: [err('Sistema de música no disponible.')], ephemeral: true })

    await interaction.deferReply()
    const fakeMsg = { guild: interaction.guild, author: interaction.user, channel: { id: interaction.channelId } }

    // URL directa
    if (isUrl(query)) {
      const result = await client.music.search(query, interaction.user).catch(() => null)
      if (!result?.tracks?.length) return interaction.editReply({ embeds: [err('No encontré resultados para esa URL.')] }).catch(() => {})
      try {
        const player = await client.music.joinChannel(interaction.guild.id, voiceChannel.id, interaction.channelId)
        const state  = client.music.getState(interaction.guild.id)
        if (result.loadType === 'playlist' && result.tracks.length > 1) {
          for (const t of result.tracks) state.queue.push(t)
          if (!state.currentTrack) await client.music._playNext(interaction.guild.id, player)
          return interaction.editReply({ embeds: [playlistAdded(result, query, interaction.user.id)] }).catch(() => {})
        }
        const track = result.tracks[0]; state.queue.push(track)
        const wasEmpty = !state.currentTrack
        if (wasEmpty) await client.music._playNext(interaction.guild.id, player)
        return interaction.editReply({ embeds: [addedEmbed(track.info || track, { isNow: wasEmpty, added: 1 }, interaction.user.id)] }).catch(() => {})
      } catch (e) {
        return interaction.editReply({ embeds: [err(e.message || String(e))] }).catch(() => {})
      }
    }

    // Nombre → picker con pestañas
    const results = await searchDiscordCatalog(client, query).catch(() => ({ tracks: [], albums: [] }))
    if (!(results.tracks?.length) && !(results.albums?.length)) {
      return interaction.editReply({ embeds: [err(`Sin resultados para **${query}**`)] }).catch(() => {})
    }
    let tab = 'tracks'
    let items = results.tracks || []
    const reply = await interaction.editReply({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'pplay') })
    const collector = reply.createMessageComponentCollector({ time: 60_000 })

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'No es tu búsqueda.', ephemeral: true }).catch(() => {})
      if (i.customId.startsWith('pplay_tab:')) {
        await i.deferUpdate(); tab = i.customId.split(':')[1]; items = results[tab] || []
        return interaction.editReply({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'pplay') }).catch(() => {})
      }
      if (i.customId === 'pplay_cancel') { collector.stop('cancel'); return interaction.deleteReply().catch(() => {}) }
      if (i.customId === 'pplay_pick') {
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
