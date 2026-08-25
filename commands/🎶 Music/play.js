// play estilo Soundy: muestra RESULTADOS (🎵 Pistas / 💿 Álbumes, clasificados) para elegir
// antes de reproducir. Las URLs (track/playlist) se reproducen directas.
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const { searchDiscordCatalog, enqueueCatalogItem, itemInfo } = require('../../handlers/discordmusiccatalog')
const { config } = require('../../handlers/music/config')
const { E, TABS, err, catEmbed, catRows, addedEmbed, playlistAdded } = require('../../handlers/music/playui')

const isUrl = s => /^https?:\/\//i.test(s)

module.exports = {
  name: 'play',
  category: '🎶 Music',
  aliases: ['p'],
  description: 'Busca y reproduce una canción, álbum, playlist o URL',
  usage: 'play <canción / URL>',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  type: 'queuesong',

  run: async (client, message, args) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')
    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(client.la[ls].common.disabled.title)] }).catch(() => {})
    }
    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel) return message.reply({ embeds: [err('Únete a un canal de voz primero.')] }).catch(() => {})
    const query = args.join(' ')
    if (!query) return message.reply({ embeds: [err('Ingresa el nombre o URL de la canción.')] }).catch(() => {})
    const perms = voiceChannel.permissionsFor(client.user)
    if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
      return message.reply({ embeds: [err('No tengo permisos para unirme a tu canal de voz.')] }).catch(() => {})
    }

    if (isUrl(query)) return handleUrl(client, message, voiceChannel, query)

    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(`${E.music} Buscando **${query.slice(0, 60)}**…`)] }).catch(() => null)
    if (!loading) return

    const results = await searchDiscordCatalog(client, query).catch(() => ({ tracks: [], albums: [] }))
    if (!(results.tracks?.length) && !(results.albums?.length)) {
      return loading.edit({ embeds: [err(`Sin resultados para **${query.slice(0, 60)}**`)] }).catch(() => {})
    }

    let tab = 'tracks'
    let items = results.tracks || []
    await loading.edit({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'pplay') }).catch(() => {})

    const collector = loading.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60_000 })
    collector.on('collect', async i => {
      if (i.customId.startsWith('pplay_tab:')) {
        await i.deferUpdate()
        tab = i.customId.split(':')[1]
        items = results[tab] || []
        return loading.edit({ embeds: [catEmbed(tab, items, query)], components: catRows(tab, items, 'pplay') }).catch(() => {})
      }
      if (i.customId === 'pplay_cancel') {
        await i.deferUpdate(); collector.stop('cancel')
        return loading.edit({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('🚫 Búsqueda cancelada.')], components: [] }).catch(() => {})
      }
      if (i.customId === 'pplay_pick') {
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

// URL directa: track o playlist/álbum → reproducir sin picker
async function handleUrl(client, message, voiceChannel, query) {
  const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(`${E.music} Cargando…`)] }).catch(() => null)
  if (!loading) return
  const result = await client.music.search(query, message.author).catch(() => null)
  if (!result?.tracks?.length) return loading.edit({ embeds: [err('No encontré resultados para esa URL.')] }).catch(() => {})
  try {
    const player = await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
    const state  = client.music.getState(message.guild.id)
    if (result.loadType === 'playlist' && result.tracks.length > 1) {
      for (const t of result.tracks) state.queue.push(t)
      if (!state.currentTrack) await client.music._playNext(message.guild.id, player)
      return loading.edit({ embeds: [playlistAdded(result, query, message.author.id)] }).catch(() => {})
    }
    const track = result.tracks[0]
    state.queue.push(track)
    const wasEmpty = !state.currentTrack
    if (wasEmpty) await client.music._playNext(message.guild.id, player)
    return loading.edit({ embeds: [addedEmbed(track.info || track, { isNow: wasEmpty, added: 1 }, message.author.id)] }).catch(() => {})
  } catch (e) {
    return loading.edit({ embeds: [err(e.message || String(e))] }).catch(() => {})
  }
}
