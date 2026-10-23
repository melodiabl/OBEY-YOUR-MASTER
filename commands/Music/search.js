const { searchCatalogPicker } = require('../../handlers/music/catalog-picker')
const obeyUi = require("../../handlers/assets/system")
const { localeFor } = require('../../handlers/i18n')
// Búsqueda estilo Soundy: pestañas 🎵 Pistas / 💿 Álbumes (clasificadas) + menú para elegir.
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const { config } = require('../../handlers/music/config')
const { E, err } = require('../../handlers/music/playui')

module.exports = {
  name: 'search',
  category: 'Music',
  aliases: ['buscar'],
  description: 'Busca canciones y álbumes y elige cuál reproducir',
  usage: 'search <canción>',
  cooldown: 5,
  parameters: { type: 'music', activeplayer: false, previoussong: false },

  run: async (client, message, args) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')
    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(obeyUi.limit(client.la[ls].common.disabled.title, 256))] }).catch(() => {})
    }
    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel) return message.reply({ embeds: [err('Debes estar en un canal de voz.')] }).catch(() => {})
    const query = args.join(' ')
    if (!query) return message.reply({ embeds: [err('Ingresa el nombre de la canción a buscar.')] }).catch(() => {})
    const perms = voiceChannel.permissionsFor(client.user)
    if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
      return message.reply({ embeds: [err('No tengo permisos para unirme a tu canal de voz.')] }).catch(() => {})
    }

    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription(obeyUi.limit(`${E.music} Buscando **${query.slice(0, 60)}**…`, 4096))] }).catch(() => null)
    if (!loading) return

    return searchCatalogPicker({ client, query, actor: message.author, guild: message.guild,
      channelId: message.channel.id, prefix: 'srch', locale: localeFor(client, message.guild.id),
      commandName: 'search', edit: payload => loading.edit(payload) })

  },
}
