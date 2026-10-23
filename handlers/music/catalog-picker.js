const { PermissionFlagsBits } = require('discord.js')
const { catEmbed, catRows, catalogPage, addedEmbed, err, itemInfo } = require('./playui')
const { enqueueCatalogItem, searchDiscordCatalog } = require('../discordmusiccatalog')
const { commandDenial } = require('./permissions')
const { t } = require('../i18n')

async function openCatalogPicker({ client, query, results, actor, guild, channelId, prefix = 'srch', edit, locale = 'es', commandName = 'play' }) {
  let tab = results.tracks?.length ? 'tracks' : 'albums'
  const pages = { tracks: 0, albums: 0 }
  let closed = false, busy = false
  const items = () => results[tab] || []
  const render = () => edit({ embeds: [catEmbed(tab, items(), query, locale, pages[tab])],
    components: catRows(tab, items(), prefix, locale, pages[tab]), allowedMentions: { parse: [] } })
  const reply = await render()
  const collector = reply.createMessageComponentCollector({ time: 60000 })
  collector.on('collect', async interaction => {
    if (interaction.user.id !== actor.id) return interaction.reply({ content: t(locale, 'music.notYourSearch'), ephemeral: true }).catch(() => {})
    if (closed || busy) return interaction.reply({ content: t(locale, closed ? 'music.searchExpired' : 'music.searchBusy'), ephemeral: true }).catch(() => {})
    const id = interaction.customId
    if (!id.startsWith(prefix + '_')) return
    busy = true
    try {
      await interaction.deferUpdate()
      if (closed) return
      if (id.startsWith(prefix + '_tab:')) {
        const selected = id.split(':')[1]
        if (!['tracks', 'albums'].includes(selected)) return
        tab = selected
        return await render()
      }
      if (id.startsWith(prefix + '_page:')) {
        const page = Number(id.split(':')[1])
        if (!Number.isInteger(page) || page < 0 || page >= catalogPage(items()).pages) return
        pages[tab] = page
        return await render()
      }
      if (id === prefix + '_cancel') {
        closed = true; collector.stop('cancel')
        return await edit({ content: t(locale, 'music.searchCancelled'), embeds: [], components: [] })
      }
      if (id !== prefix + '_pick') return
      const value = interaction.values?.[0]
      if (typeof value !== 'string' || !/^\d+$/.test(value) || !items()[Number(value)]) return
      const item = items()[Number(value)]
      // Consume before awaits: the second click cannot create a second enqueue.
      closed = true; collector.stop('picked')
      const authorize = async () => {
        const member = await guild.members.fetch({ user: actor.id, force: true })
        const voice = member.voice?.channel
        if (!voice || voice.guild && voice.guild.id !== guild.id) throw new Error(t(locale, 'music.joinVoiceSearch'))
        if (client.settings.get(guild.id, 'MUSIC') === false) throw new Error(t(locale, 'music.searchDisabled'))
        const bot = guild.members.me || client.user
        if (!voice.permissionsFor(bot)?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) throw new Error(t(locale, 'music.searchVoicePermissions'))
        const denial = commandDenial(client, member, commandName)
        if (denial) throw new Error(denial)
        return voice
      }
      const message = { guild, author: actor, channel: { id: channelId } }
      const queued = await enqueueCatalogItem(client, message, null, item, { authorize })
      return await edit({ embeds: [addedEmbed(itemInfo(item), queued, actor.id, locale)], components: [] })
    } catch (error) {
      closed = true; collector.stop('error')
      await edit({ embeds: [err(error.message || t(locale, 'music.searchFailed'))], components: [] }).catch(() => {})
    } finally { busy = false }
  })
  collector.on('end', (_, reason) => {
    closed = true
    if (!['picked', 'cancel', 'error'].includes(reason)) edit({ components: [] }).catch(() => {})
  })
  return collector
}

async function searchCatalogPicker(options) {
  const { client, query, guild, edit, locale = 'es' } = options
  let results
  try { results = await searchDiscordCatalog(client, query, { guildId: guild.id, limit: 50 }) }
  catch (error) {
    return edit({ embeds: [err(t(locale, error.code === 'music_search_busy' ? 'music.searchBusy' : 'music.searchFailed'))], components: [] })
  }
  if (!results.tracks.length && !results.albums.length) return edit({
    embeds: [err(t(locale, 'music.noResultsQuery', { query: query.slice(0, 60) }))], components: [] })
  return openCatalogPicker({ ...options, results })
}

module.exports = { openCatalogPicker, searchCatalogPicker }
