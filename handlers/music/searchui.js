// UI compartida de resultados de búsqueda (tabs + select menu)
// Usada por prefix !play/!search y slash /music play
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { fmtMs, MUSIC_ICON } = require('./utils')
const { config } = require('../music/config')
const E = config.emoji
const { itemInfo } = require('../discordmusiccatalog')

const TABS = [
  { id: 'tracks', label: 'Pistas',  emoji: '🎵', color: 0x1DB954 },
  { id: 'albums', label: 'Álbumes', emoji: '💿', color: 0x1DB954 },
]
const OPTION_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

function buildSearchEmbed(tab, items, query) {
  if (!items.length) {
    return new EmbedBuilder().setColor(0x4f545c)
      .setTitle(`🔍 "${query}"`)
      .setDescription(`Sin resultados en **${tab.emoji} ${tab.label}**.\nPrueba otra categoría.`)
      .setFooter({ text: 'Cambia de categoría • expira en 60s' })
  }

  const firstInfo = itemInfo(items[0])
  const artwork   = firstInfo.artworkUrl || firstInfo.thumbnail || null

  const lines = items.slice(0, 10).map((t, i) => {
    const info   = itemInfo(t)
    const num    = `**${i + 1}.**`
    const title  = (info?.title  || '?').substring(0, 55)
    const author = (info?.author || '?').substring(0, 40)

    if (tab.id === 'albums') {
      return `${num} **[${title}](${info?.uri || ''})**\n┗ ${E.music} ${author}${info.totalTracks ? ` · ${info.totalTracks} pistas` : ''}`
    }
    return `${num} **[${title}](${info?.uri || ''})** \`${fmtMs(info?.length)}\`\n┗ ${E.artist} ${author}`
  })

  return new EmbedBuilder()
    .setColor(tab.color)
    .setAuthor({ name: `🔍 Resultados para "${query.substring(0, 50)}"`, iconURL: MUSIC_ICON })
    .setTitle(`${tab.emoji} ${tab.label}`)
    .setDescription(lines.join('\n\n'))
    .setThumbnail(artwork)
    .setFooter({ text: `${items.length} resultados • Selecciona uno o cambia de categoría • expira en 60s` })
}

function buildSearchComponents(cidPrefix, activeTabId, items) {
  const rows = []
  if (items.length) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${cidPrefix}_pick`)
        .setPlaceholder(`Elige ${activeTabId === 'albums' ? 'un álbum' : 'una canción'}…`)
        .addOptions(items.slice(0, 10).map((t, i) => {
          const info = itemInfo(t)
          const option = {
            label:       (info?.title || '?').substring(0, 100),
            description: `${(info?.author || '?').substring(0, 45)}${info.totalTracks ? ` · ${info.totalTracks} pistas` : ''} · ${fmtMs(info?.length)}`.substring(0, 100),
            value:       String(i),
          }
          if (OPTION_EMOJIS[i]) option.emoji = OPTION_EMOJIS[i]
          return option
        }))
    ))
  }
  rows.push(new ActionRowBuilder().addComponents(
    ...TABS.map(t =>
      new ButtonBuilder()
        .setCustomId(`${cidPrefix}_tab:${t.id}`)
        .setLabel(`${t.emoji} ${t.label}`)
        .setStyle(t.id === activeTabId ? ButtonStyle.Primary : ButtonStyle.Secondary)
    ),
    new ButtonBuilder().setCustomId(`${cidPrefix}_cancel`).setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('✖️')
  ))
  return rows
}

module.exports = { TABS, buildSearchEmbed, buildSearchComponents }
