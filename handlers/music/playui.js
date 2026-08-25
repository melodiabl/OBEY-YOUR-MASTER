// UI compartida de play/search estilo Soundy: pestañas LIMPIAS 🎵 Pistas / 💿 Álbumes
// (clasificados, sin mezclar) + menú para elegir, y embeds "Añadido" / "Álbum" / "Playlist".
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { config } = require('./config')
const { platform } = require('./utils')
const { itemInfo } = require('../discordmusiccatalog')

const E = config.emoji
const DISK = 'https://cdn.darrennathanael.com/icons/spinning_disk.gif'
const OPTION_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

const TABS = [
  { id: 'tracks', label: 'Pistas',  emoji: '🎵' },
  { id: 'albums', label: 'Álbumes', emoji: '💿' },
]

function fmtMs(ms) { const s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60), sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}` }
function totalFmt(tracks) { return fmtMs(tracks.reduce((a, t) => a + (t.info?.length || 0), 0)) }
const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(`${E.no} ${d}`)

// Lista limpia de la categoría activa (pistas o álbumes)
function catEmbed(tabId, items, query) {
  const tab = TABS.find(t => t.id === tabId) || TABS[0]
  if (!items.length) {
    return new EmbedBuilder().setColor(0x4f545c)
      .setAuthor({ name: `Resultados para "${query.slice(0, 50)}"`, iconURL: DISK })
      .setTitle(`${tab.emoji} ${tab.label}`)
      .setDescription(`Sin ${tab.id === 'albums' ? 'álbumes' : 'pistas'} para esta búsqueda.`)
      .setFooter({ text: 'Cambia de categoría abajo · expira en 60s' })
  }
  const first = itemInfo(items[0])
  const lines = items.slice(0, 10).map((t, i) => {
    const info = itemInfo(t)
    const title = (info?.title || '?').slice(0, 55), author = (info?.author || '?').slice(0, 40)
    if (tab.id === 'albums') {
      return `**${i + 1}.** **[${title}](${info?.uri || ''})**\n┗ ${E.music} ${author}${info.totalTracks ? ` · ${info.totalTracks} pistas` : ''}`
    }
    return `**${i + 1}.** **[${title}](${info?.uri || ''})** \`${fmtMs(info?.length)}\`\n┗ ${E.artist} ${author}`
  })
  return new EmbedBuilder().setColor(config.color.primary)
    .setAuthor({ name: `Resultados para "${query.slice(0, 50)}"`, iconURL: DISK })
    .setTitle(`${tab.emoji} ${tab.label}`)
    .setDescription(lines.join('\n\n'))
    .setThumbnail(first?.artworkUrl || first?.thumbnail || null)
    .setFooter({ text: `${items.length} ${tab.id === 'albums' ? 'álbumes' : 'pistas'} · elige uno · cambia de categoría abajo · 60s` })
}

function catRows(tabId, items, cid = 'srch') {
  const rows = []
  if (items.length) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId(`${cid}_pick`)
        .setPlaceholder(tabId === 'albums' ? '💿 Elige un álbum…' : '🎵 Elige una canción…')
        .addOptions(items.slice(0, 10).map((t, i) => {
          const info = itemInfo(t)
          const desc = tabId === 'albums'
            ? `${(info?.author || '?').slice(0, 40)}${info.totalTracks ? ` · ${info.totalTracks} pistas` : ''}`
            : `${(info?.author || '?').slice(0, 45)} · ${fmtMs(info?.length)}`
          const o = { label: (info?.title || '?').slice(0, 100), description: desc.slice(0, 100), value: String(i) }
          if (OPTION_EMOJIS[i]) o.emoji = OPTION_EMOJIS[i]
          return o
        })),
    ))
  }
  rows.push(new ActionRowBuilder().addComponents(
    ...TABS.map(t => new ButtonBuilder().setCustomId(`${cid}_tab:${t.id}`).setLabel(`${t.emoji} ${t.label}`)
      .setStyle(t.id === tabId ? ButtonStyle.Primary : ButtonStyle.Secondary)),
    new ButtonBuilder().setCustomId(`${cid}_cancel`).setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('✖️'),
  ))
  return rows
}

// queued = { isNow, added }
function addedEmbed(info, queued, userId) {
  const plat = platform(info?.catalogUri || info?.uri || '', info?.catalogSourceName || info?.sourceName || '')
  const isCol = (queued?.added || 1) > 1
  const e = new EmbedBuilder().setColor(plat.color)
    .setDescription(`**[${info?.title || '?'}](${info?.uri || ''})**`)
    .setThumbnail(info?.artworkUrl || info?.thumbnail || null)
    .setTimestamp()
  if (isCol) {
    e.setTitle(`${E.folder} Álbum añadido`).addFields(
      { name: `${E.list} Pistas`,     value: `\`${queued.added}\``, inline: true },
      { name: `${E.user} Pedido por`, value: `<@${userId}>`, inline: true },
    )
  } else {
    e.setTitle(`${queued?.isNow ? E.play : E.list} ${queued?.isNow ? 'Reproduciendo ahora' : 'Añadido a la cola'}`).addFields(
      { name: `${E.artist} Artista`,  value: `\`${(info?.author || '?').slice(0, 45)}\``, inline: true },
      { name: `${E.clock} Duración`,  value: info?.isStream ? '🔴 LIVE' : `\`${fmtMs(info?.length)}\``, inline: true },
      { name: `${E.user} Pedido por`, value: `<@${userId}>`, inline: true },
    )
  }
  return e
}

function playlistAdded(result, query, userId) {
  const info0 = result.tracks[0]?.info || result.tracks[0]
  const plat  = platform(info0?.uri || '', info0?.sourceName || '')
  return new EmbedBuilder().setColor(plat.color)
    .setTitle(`${E.folder} Playlist añadida`)
    .setDescription(`**[${result.playlistInfo?.name || result.playlistName || 'Lista de reproducción'}](${query})**`)
    .setThumbnail(info0?.artworkUrl || info0?.thumbnail || null)
    .addFields(
      { name: `${E.list} Pistas`,     value: `\`${result.tracks.length}\``,   inline: true },
      { name: `${E.clock} Duración`,  value: `\`${totalFmt(result.tracks)}\``, inline: true },
      { name: `${E.user} Pedido por`, value: `<@${userId}>`, inline: true },
    )
    .setTimestamp()
}

module.exports = { E, TABS, fmtMs, totalFmt, err, catEmbed, catRows, addedEmbed, playlistAdded, itemInfo }
