const obeyMeta = require("../presentation/metadata")
const obeyUi = require("../assets/system")
const { registry } = require('../assets/registry')
const { t } = require('../i18n')
// Colección personal compartida por comandos, botón de Discord y panel web.
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const LikedSongs = require('../../database/schemas/LikedSongsSchema')
const { config } = require('../music/config')

const HEART = config.emoji.heart   // emoji custom de Soundy subido a la app
const PRIMARY = 0xED4245   // rojo "me gusta"
const NEUTRAL = 0x4f545c

function fmtDuration(ms, isStream) {
  if (isStream) return 'LIVE'
  if (!ms) return 'Desconocido'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

// The URI survives a node change; historical encoded/identifier keys remain readable.
function trackKey(track) {
  const info = track?.info || track || {}
  return [info.catalogUri, info.uri, info.identifier, track?.trackId, track?.encoded].find(v => typeof v === 'string' && v.length > 0) || null
}

function trackMeta(track) {
  const info = track?.info || track || {}
  return {
    uri:        [info.catalogUri, info.uri].find(v => typeof v === 'string' && v) || '',
    title:      info.title || 'Desconocido',
    author:     info.author || 'Desconocido',
    artworkUrl: info.artworkUrl || info.thumbnail || null,
    length:     info.length || info.duration || 0,
    isStream:   !!info.isStream,
    sourceName: info.catalogSourceName || info.sourceName || '',
  }
}

function createLikedSongsService(store) {
  const writes = require('./action-queue').createActionQueue()
  function identity(userId, track) {
    if (typeof userId !== 'string' || !userId || !trackKey(track)) return null
    const info = track?.info || track || {}, uri = trackMeta(track).uri
    const keys = [...new Set([trackKey(track), track?.trackId, track?.encoded, info.identifier].filter(v => typeof v === 'string' && v))]
    return { userId, $or: [...keys.map(trackId => ({ trackId })), ...(uri ? [{ uri }] : [])] }
  }
  async function isTrackLiked(userId, track) {
    const query = identity(userId, track)
    return query ? Boolean(await store.findOne(query)) : false
  }
  async function setLiked(userId, track, desired) {
    const query = identity(userId, track)
    if (!query) return null
    return writes.run(userId, async () => {
      const existing = await store.findOne(query), meta = trackMeta(track)
      const liked = typeof desired === 'boolean' ? desired : !existing
      if (!liked) await store.deleteMany(query)
      else if (!existing) {
        await store.updateOne({ userId, trackId: trackKey(track) }, { $setOnInsert: meta }, { upsert: true })
      }
      return { liked, meta }
    })
  }
  async function getLikedSongs(userId) {
    if (typeof userId !== 'string' || !userId) return []
    const rows = await store.find({ userId }).sort({ likedAt: -1 }).lean(), seen = new Set()
    return rows.filter(row => {
      const key = row.uri || row.trackId
      if (!key || seen.has(key)) return false
      seen.add(key); return true
    })
  }
  return { isTrackLiked, setLiked, toggleLike: (userId, track) => setLiked(userId, track),
    getLikedSongs, getLikedSongsCount: async userId => (await getLikedSongs(userId)).length }
}

// ── UI ──────────────────────────────────────────────────────────────────────

// Embed del toggle like/unlike (réplica del "Added/Removed from Liked Songs" de Soundy)
function buildLikeEmbed({ liked, meta }) {
  const embed = new EmbedBuilder()
    .setColor(liked ? PRIMARY : NEUTRAL)
    .setTitle(obeyUi.limit(`${HEART} ${liked ? 'Añadida a Tus Me gusta' : 'Quitada de Tus Me gusta'}`, 256))
    .setDescription(obeyUi.limit(`${obeyUi.markup("icon.music")} **[${meta.title}](${meta.uri})**\n${obeyUi.markup("icon.microphone")} \`${meta.author}\``, 4096))
    .setTimestamp()
  if (meta.artworkUrl) embed.setThumbnail(meta.artworkUrl)
  return embed
}

// Páginas del listado de favoritos: 5 por página, formato exacto de Soundy
const PER_PAGE = 5
function buildLikedPages(songs, totalCount, user) {
  const pages = []
  for (let i = 0; i < songs.length; i += PER_PAGE) {
    const slice = songs.slice(i, i + PER_PAGE)
    const desc = slice.map((t, idx) => {
      const dur    = fmtDuration(t.length, t.isStream)
      const title  = (t.title || '?').length > 45 ? (t.title).slice(0, 42) + '...' : (t.title || '?')
      const author = (t.author || '?').length > 35 ? (t.author).slice(0, 32) + '...' : (t.author || '?')
      const ts     = Math.floor(new Date(t.likedAt).getTime() / 1000)
      const name   = t.uri ? `**[${title}](${t.uri})**` : `**${title}**`
      return `${i + idx + 1}. ${name} — \`${author}\`\n┗ \`${dur}\` • <t:${ts}:R>`
    }).join('\n\n')

    const embed = new EmbedBuilder()
      .setColor(PRIMARY)
      .setAuthor(obeyMeta.asAuthor({ name: `${HEART} Favoritos de ${user.username}`, iconURL: user.displayAvatarURL?.() }))
      .setDescription(obeyUi.limit(desc, 4096))
      .setFooter(obeyMeta.asFooter({ text: `Página ${Math.floor(i / PER_PAGE) + 1} • Mostrando ${i + 1}-${Math.min(i + PER_PAGE, songs.length)} de ${totalCount}` }))
      .setTimestamp()
    if (slice[0]?.artworkUrl) embed.setThumbnail(slice[0].artworkUrl)
    pages.push(embed)
  }
  return pages
}

function buildLikedRows(page, totalPages, locale = 'es') {
  if (totalPages <= 1) return []
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lk_prev:${page}`).setEmoji(obeyUi.component(registry.emoji('icon.page-previous'))).setLabel(obeyUi.plain(t(locale, 'common.previous'))).setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId('lk_close').setLabel(obeyUi.plain(t(locale, 'common.close'))).setEmoji(obeyUi.component(registry.emoji('icon.close'))).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`lk_next:${page}`).setEmoji(obeyUi.component(registry.emoji('icon.page-next'))).setLabel(obeyUi.plain(t(locale, 'common.next'))).setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages),
  )]
}

module.exports = {
  trackKey, trackMeta, createLikedSongsService, ...createLikedSongsService(LikedSongs),
  buildLikeEmbed, buildLikedPages, buildLikedRows,
}
