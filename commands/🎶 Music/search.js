// Búsqueda estilo Soundy: pestañas 🎵 Pistas / 💿 Álbumes (clasificadas) + menú para elegir.
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const { searchDiscordCatalog, enqueueCatalogItem, itemInfo } = require('../../handlers/discordmusiccatalog')
const { config } = require('../../handlers/music/config')
const { E, err, catEmbed, catRows, addedEmbed } = require('../../handlers/music/playui')

module.exports = {
  name: 'search',
  category: '🎶 Music',
  aliases: ['buscar'],
  description: 'Busca canciones y álbumes y elige cuál reproducir',
  usage: 'search <canción>',
  cooldown: 5,
  parameters: { type: 'music', activeplayer: false, previoussong: false },

  run: async (client, message, args) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')
    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(client.la[ls].common.disabled.title)] }).catch(() => {})
    }
    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel) return message.reply({ embeds: [err('Debes estar en un canal de voz.')] }).catch(() => {})
    const query = args.join(' ')
    if (!query) return message.reply({ embeds: [err('Ingresa el nombre de la canción a buscar.')] }).catch(() => {})
    const perms = voiceChannel.permissionsFor(client.user)
    if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
      return message.reply({ embeds: [err('No tengo permisos para unirme a tu canal de voz.')] }).catch(() => {})
    }

    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(`${E.music} Buscando **${query.slice(0, 60)}**…`)] }).catch(() => null)
    if (!loading) return

    const results = await searchDiscordCatalog(client, query).catch(() => ({ tracks: [], albums: [] }))
    if (!(results.tracks?.length) && !(results.albums?.length)) {
      return loading.edit({ embeds: [err(`Sin resultados para **${query.slice(0, 60)}**`)] }).catch(() => {})
    }

    let tab = 'tracks'
    let items = results.tracks || []
    await loading.edit({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'srch') }).catch(() => {})

    const collector = loading.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60_000 })
    collector.on('collect', async i => {
      if (i.customId.startsWith('srch_tab:')) {
        await i.deferUpdate()
        tab = i.customId.split(':')[1]
        items = results[tab] || []
        return loading.edit({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'srch') }).catch(() => {})
      }
      if (i.customId === 'srch_cancel') {
        await i.deferUpdate(); collector.stop('cancel')
        return loading.edit({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('🚫 Búsqueda cancelada.')], components: [] }).catch(() => {})
      }
      if (i.customId === 'srch_pick') {
        await i.deferUpdate(); collector.stop('picked')
        const item = items[parseInt(i.values[0])]
        const info = itemInfo(item)
        try {
          const queued = await enqueueCatalogItem(client, message, voiceChannel, item)
          await loading.edit({ embeds: [addedEmbed(info, queued, message.author.id)], components: [] }).catch(() => {})
        } catch (e) {
          await loading.edit({ embeds: [err(e.message || String(e))], components: [] }).catch(() => {})
        }
      }
    })
    collector.on('end', (_, reason) => {
      if (!['cancel', 'picked'].includes(reason)) loading.edit({ components: [] }).catch(() => {})
    })
  },
}
