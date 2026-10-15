const obeyMeta = require("../presentation/metadata")
const obeyUi = require("../assets/system")
// UI compartida de play/search estilo Soundy: pestañas LIMPIAS 🎵 Pistas / 💿 Álbumes
// (clasificados, sin mezclar) + menú para elegir, y embeds "Añadido" / "Álbum" / "Playlist".
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { config } = require('./config')
const { platform, MUSIC_ICON } = require('./utils')
const { itemInfo } = require('../discordmusiccatalog')

const { registry } = require('../assets/registry')
const { t: translate } = require('../i18n')
const E = config.emoji
const DISK = MUSIC_ICON
// Ordinals are text; option emoji identifies the kind of result.

const TABS = [
  { id: 'tracks', label: 'Pistas', emoji: obeyUi.component('🎵'), asset: 'icon.music' },
  { id: 'albums', label: 'Álbumes', emoji: obeyUi.component('💿'), asset: 'icon.album' },
]

function fmtMs(ms) { const s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}` }
function totalFmt(tracks) { return fmtMs(tracks.reduce((a, t) => a + (t.info?.length || 0), 0)) }
const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${E.no} ${d}`, 4096))

// Lista limpia de la categoría activa (pistas o álbumes)
function catEmbed(tabId, items, query, locale = 'es') {
  const tab = TABS.find(t => t.id === tabId) || TABS[0]
  if (!items.length) {
    return new EmbedBuilder().setColor(0x4f545c)
      .setAuthor(obeyMeta.asAuthor({ name: translate(locale, 'music.resultsFor', { query: query.slice(0, 50) }), iconURL: DISK }))
      .setTitle(obeyUi.limit(`${registry.markup(tab.asset)} ${translate(locale, `music.${tab.id}`)}`, 256))
      .setDescription(obeyUi.limit(translate(locale, tab.id === 'albums' ? 'music.noAlbums' : 'music.noTracks'), 4096))
      .setFooter(obeyMeta.asFooter({ text: translate(locale, 'music.emptyFooter') }))
  }
  const first = itemInfo(items[0])
  const lines = items.slice(0, 10).map((t, i) => {
    const info = itemInfo(t)
    const title = (info?.title || '?').slice(0, 55), author = (info?.author || '?').slice(0, 40)
    if (tab.id === 'albums') {
      return `**${i + 1}.** **[${title}](${info?.uri || ''})**\n┗ ${E.music} ${author}${info.totalTracks ? ` · ${translate(locale, 'music.trackCount', { count: info.totalTracks })}` : ''}`
    }
    return `**${i + 1}.** **[${title}](${info?.uri || ''})** \`${fmtMs(info?.length)}\`\n┗ ${E.artist} ${author}`
  })
  return new EmbedBuilder().setColor(config.color.primary)
    .setAuthor(obeyMeta.asAuthor({ name: translate(locale, 'music.resultsFor', { query: query.slice(0, 50) }), iconURL: DISK }))
    .setTitle(obeyUi.limit(`${registry.markup(tab.asset)} ${translate(locale, `music.${tab.id}`)}`, 256))
    .setDescription(obeyUi.limit(lines.join('\n\n'), 4096))
    .setThumbnail(first?.artworkUrl || first?.thumbnail || null)
    .setFooter(obeyMeta.asFooter({ text: translate(locale, 'music.resultsFooter', { count: items.length, category: translate(locale, `music.${tab.id}`).toLowerCase() }) }))
}

function catRows(tabId, items, cid = 'srch', locale = 'es') {
  const rows = []
  if (items.length) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId(`${cid}_pick`)
        .setPlaceholder(obeyUi.plain(translate(locale, tabId === 'albums' ? 'music.chooseAlbum' : 'music.chooseTrack')))
        .addOptions(items.slice(0, 10).map((t, i) => {
          const info = itemInfo(t)
          const desc = tabId === 'albums'
            ? `${(info?.author || '?').slice(0, 40)}${info.totalTracks ? ` · ${translate(locale, 'music.trackCount', { count: info.totalTracks })}` : ''}`
            : `${(info?.author || '?').slice(0, 45)} · ${fmtMs(info?.length)}`
          const o = { label: `${i + 1}. ${info?.title || '?'}`.slice(0, 100), description: desc.slice(0, 100), value: String(i) }
          o.emoji = registry.emoji(tabId === 'albums' ? 'icon.album' : 'icon.music')
          return o
        })),
    ))
  }
  rows.push(new ActionRowBuilder().addComponents(
    ...TABS.map(tab => new ButtonBuilder().setCustomId(`${cid}_tab:${tab.id}`).setLabel(obeyUi.plain(translate(locale, `music.${tab.id}`))).setEmoji(obeyUi.component(registry.emoji(tab.asset)))
      .setStyle(tab.id === tabId ? ButtonStyle.Primary : ButtonStyle.Secondary)),
    new ButtonBuilder().setCustomId(`${cid}_cancel`).setLabel(obeyUi.plain(translate(locale, 'common.cancel'))).setStyle(ButtonStyle.Danger).setEmoji(obeyUi.component(registry.emoji('icon.close'))),
  ))
  return rows
}

// queued = { isNow, added }
function addedEmbed(info, queued, userId, locale = 'es') {
  const plat = platform(info?.catalogUri || info?.uri || '', info?.catalogSourceName || info?.sourceName || '')
  const isCol = (queued?.added || 1) > 1
  const e = new EmbedBuilder().setColor(plat.color)
    .setDescription(obeyUi.limit(`**[${info?.title || '?'}](${info?.uri || ''})**`, 4096))
    .setThumbnail(info?.artworkUrl || info?.thumbnail || null)
    .setTimestamp()
  if (isCol) {
    e.setTitle(obeyUi.limit(`${registry.markup('icon.album')} ${translate(locale, 'music.albumAdded')}`, 256)).addFields(
      { name: `${registry.markup('icon.queue')} ${translate(locale, 'music.tracks')}`,     value: `\`${queued.added}\``, inline: true },
      { name: `${registry.markup('icon.profile')} ${translate(locale, 'music.requestedBy')}`, value: `<@${userId}>`, inline: true },
    )
  } else {
    e.setTitle(obeyUi.limit(`${queued?.isNow ? E.play : E.list} ${translate(locale, queued?.isNow ? 'music.playingNow' : 'music.addedToQueue')}`, 256)).addFields(
      { name: `${registry.markup('icon.profile')} ${translate(locale, 'music.artist')}`,  value: `\`${(info?.author || '?').slice(0, 45)}\``, inline: true },
      { name: `${E.clock} ${translate(locale, 'music.duration')}`,  value: info?.isStream ? translate(locale, 'music.live') : `\`${fmtMs(info?.length)}\``, inline: true },
      { name: `${registry.markup('icon.profile')} ${translate(locale, 'music.requestedBy')}`, value: `<@${userId}>`, inline: true },
    )
  }
  return e
}

function playlistAdded(result, query, userId, locale = 'es') {
  const info0 = result.tracks[0]?.info || result.tracks[0]
  const plat  = platform(info0?.uri || '', info0?.sourceName || '')
  return new EmbedBuilder().setColor(plat.color)
    .setTitle(obeyUi.limit(`${registry.markup('icon.queue')} ${translate(locale, 'music.playlistAdded')}`, 256))
    .setDescription(obeyUi.limit(`**[${result.playlistInfo?.name || result.playlistName || translate(locale, 'music.playlist')}](${query})**`, 4096))
    .setThumbnail(info0?.artworkUrl || info0?.thumbnail || null)
    .addFields(
      { name: `${registry.markup('icon.queue')} ${translate(locale, 'music.tracks')}`,     value: `\`${result.tracks.length}\``,   inline: true },
      { name: `${E.clock} ${translate(locale, 'music.duration')}`,  value: `\`${totalFmt(result.tracks)}\``, inline: true },
      { name: `${registry.markup('icon.profile')} ${translate(locale, 'music.requestedBy')}`, value: `<@${userId}>`, inline: true },
    )
    .setTimestamp()
}

module.exports = { E, TABS, fmtMs, totalFmt, err, catEmbed, catRows, addedEmbed, playlistAdded, itemInfo }
