const { searchCatalogPicker } = require('../../handlers/music/catalog-picker')
const obeyUi = require("../../handlers/assets/system")
const { localeFor } = require('../../handlers/i18n')
// play estilo Soundy: muestra RESULTADOS (🎵 Pistas / 💿 Álbumes, clasificados) para elegir
// antes de reproducir. Las URLs (track/playlist) se reproducen directas.
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const { config } = require('../../handlers/music/config')
const { E, err, addedEmbed, playlistAdded } = require('../../handlers/music/playui')

const isUrl = s => /^https?:\/\//i.test(s)

module.exports = {
  name: 'play',
  category: 'Music',
  aliases: ['p'],
  description: 'Busca y reproduce una canción, álbum, playlist o URL',
  usage: 'play <canción / URL>',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  type: 'queuesong',

  run: async (client, message, args) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')
    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(obeyUi.limit(client.la[ls].common.disabled.title, 256))] }).catch(() => {})
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

    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(obeyUi.limit(`${E.music} Buscando **${query.slice(0, 60)}**…`, 4096))] }).catch(() => null)
    if (!loading) return

    return searchCatalogPicker({ client, query, actor: message.author, guild: message.guild,
      channelId: message.channel.id, prefix: 'pplay', locale: localeFor(client, message.guild.id),
      commandName: 'play', edit: payload => loading.edit(payload) })

  },
}

// URL directa: track o playlist/álbum → reproducir sin picker
async function handleUrl(client, message, voiceChannel, query) {
  const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(obeyUi.limit(`${E.music} Cargando…`, 4096))] }).catch(() => null)
  if (!loading) return
  const result = await client.music.search(query, message.author, { guildId: message.guild.id }).catch(() => null)
  if (!result?.tracks?.length) return loading.edit({ embeds: [err('No encontré resultados para esa URL.')] }).catch(() => {})
  try {
    const player = await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
    const state  = client.music.getState(message.guild.id)
    if (result.loadType === 'playlist' && result.tracks.length > 1) {
      await client.music.enqueue(message.guild.id, result.tracks)
      return loading.edit({ embeds: [playlistAdded(result, query, message.author.id, localeFor(client, message.guild.id))] }).catch(() => {})
    }
    const track = result.tracks[0]
    const wasEmpty = !state.currentTrack
    await client.music.enqueue(message.guild.id, [track])
    return loading.edit({ embeds: [addedEmbed(track.info || track, { isNow: wasEmpty, added: 1 }, message.author.id, localeFor(client, message.guild.id))] }).catch(() => {})
  } catch (e) {
    return loading.edit({ embeds: [err(e.message || String(e))] }).catch(() => {})
  }
}
