const { PermissionFlagsBits } = require('discord.js')
const { catEmbed, catRows, catalogPage, addedEmbed, err, itemInfo, SEARCH_SOURCES } = require('./playui')
const { enqueueCatalogItem, searchDiscordCatalog } = require('../discordmusiccatalog')
const { commandDenial } = require('./permissions')
const { t } = require('../i18n')
const { getArtist } = require('./artists')

async function openCatalogPicker({ client, query, results, actor, guild, channelId, prefix = 'srch', edit, locale = 'es', commandName = 'play' }) {
  query = results.query || query.replace(/^(?:spsearch|amsearch|ytsearch|ytmsearch):/i, '')
  let tab = ['tracks', 'albums', 'artists'].includes(results.kind) ? results.kind : ['tracks', 'albums', 'artists'].includes(results.preferredTab) && results[results.preferredTab]?.length
    ? results.preferredTab : results.tracks?.length ? 'tracks' : results.artists?.length ? 'artists' : 'albums', profile = null
  let source = results.source || 'auto'
  const controller = new AbortController()
  const pages = { tracks: 0, albums: 0, artists: 0 }
  let closed = false, busy = false
  const items = () => (profile || results)[tab] || []
  const render = () => {
    const embed = catEmbed(tab, items(), profile?.artist.title || query, locale, pages[tab], { status: results.statuses?.[tab], source: results.sources?.[tab] })
    if (profile) embed.setAuthor({ name: profile.artist.title }).setTitle(t(locale, tab === 'tracks' ? 'music.artistTopTracks' : 'music.artistAlbums')).setThumbnail(profile.artist.artworkUrl || null)
    return edit({ content: null, embeds: [embed], components: catRows(tab, items(), prefix, locale, pages[tab], { artistView: Boolean(profile), source }), allowedMentions: { parse: [] } })
  }
  const load = async () => {
    const pending = searchDiscordCatalog(client, query, { guildId: guild.id, limit: 50, kind: tab, source, signal: controller.signal }).catch(error => ({ error }))
    results[tab] = []; pages[tab] = 0
    results.statuses = { ...results.statuses, [tab]: 'loading' }
    await render()
    const next = await pending
    if (closed) return
    results[tab] = next[tab] || []
    results.statuses = { ...results.statuses, [tab]: next.error ? 'unavailable' : next.statuses?.[tab] || (results[tab].length ? 'ready' : 'empty') }
    results.sources = { ...results.sources, [tab]: next.sources?.[tab] }
    return render()
  }
  const reply = await render()
  const collector = reply.createMessageComponentCollector({ time: 600000, idle: 120000 })
  collector.on('collect', async interaction => {
    if (interaction.user.id !== actor.id) return interaction.reply({ content: t(locale, 'music.notYourSearch'), ephemeral: true }).catch(() => {})
    if (closed || busy) return interaction.reply({ content: t(locale, closed ? 'music.searchExpired' : 'music.searchBusy'), ephemeral: true }).catch(() => {})
    const id = interaction.customId
    if (!id.startsWith(prefix + '_')) return
    busy = true
    try {
      await interaction.deferUpdate()
      if (closed) return
      if (id === prefix + '_artists-back') { profile = null; tab = 'artists'; return await render() }
      if (id === prefix + '_source' && !profile) {
        const selected = interaction.values?.[0]
        if (!Object.hasOwn(SEARCH_SOURCES, selected)) return
        source = selected
        for (const kind of ['tracks', 'albums', 'artists']) { results[kind] = []; pages[kind] = 0 }
        results.statuses = {}; results.sources = {}
        return await load()
      }
      if (id === prefix + '_retry' && !profile) return await load()
      if (id.startsWith(prefix + '_tab:')) {
        const selected = id.split(':')[1]
        if (!['tracks', 'albums', ...(profile ? [] : ['artists'])].includes(selected)) return
        tab = selected
        if (!profile && (!results.statuses?.[tab] && !results[tab]?.length || results.statuses?.[tab] === 'unavailable')) return await load()
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
      if (tab === 'artists' && !profile) {
        try {
          const result = await getArtist(client, item.uri, { guildId: guild.id, signal: controller.signal })
          if (closed) return
          profile = result; tab = 'tracks'; pages.tracks = 0; pages.albums = 0
          return await render()
        } catch {
          if (!closed) await interaction.followUp({ content: t(locale, 'music.artistUnavailable'), ephemeral: true }).catch(() => {})
          return
        }
      }
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
    controller.abort()
    if (!['picked', 'cancel', 'error'].includes(reason)) edit({ content: t(locale, 'music.searchExpired'), components: [] }).catch(() => {})
  })
  return collector
}

async function searchCatalogPicker(options) {
  const { client, query, guild, edit, locale = 'es' } = options
  let results
  try { results = await searchDiscordCatalog(client, query, { guildId: guild.id, limit: 50, kind: 'tracks', source: 'auto' }) }
  catch (error) {
    return edit({ embeds: [err(t(locale, error.code === 'music_search_busy' ? 'music.searchBusy' : 'music.searchFailed'))], components: [] })
  }
  return openCatalogPicker({ ...options, results })
}

module.exports = { openCatalogPicker, searchCatalogPicker }
