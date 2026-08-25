// Lógica compartida del sistema de favoritos ("liked songs"), replica exacta de Soundy.
// Usada por prefix, slash y el botón ❤️ del Now Playing.
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

// Clave única del track: encoded → identifier → uri (igual que Soundy: encoded || identifier)
function trackKey(track) {
  const info = track?.info || track || {}
  return track?.encoded || info.identifier || info.uri || null
}

function trackMeta(track) {
  const info = track?.info || track || {}
  return {
    uri:        info.uri || '',
    title:      info.title || 'Desconocido',
    author:     info.author || 'Desconocido',
    artworkUrl: info.artworkUrl || info.thumbnail || null,
    length:     info.length || info.duration || 0,
    isStream:   !!info.isStream,
    sourceName: info.sourceName || info.catalogSourceName || '',
  }
}

async function isTrackLiked(userId, track) {
  const trackId = trackKey(track)
  if (!userId || !trackId) return false
  return !!(await LikedSongs.exists({ userId, trackId }).catch(() => false))
}

// Toggle: devuelve { liked: true|false, meta } o null si error/sin datos
async function toggleLike(userId, track) {
  const trackId = trackKey(track)
  if (!userId || !trackId) return null
  const meta = trackMeta(track)
  const existing = await LikedSongs.findOne({ userId, trackId }).catch(() => null)
  if (existing) {
    await LikedSongs.deleteOne({ _id: existing._id }).catch(() => {})
    return { liked: false, meta }
  }
  await LikedSongs.create({ userId, trackId, ...meta }).catch(() => {})
  return { liked: true, meta }
}

async function getLikedSongs(userId) {
  return LikedSongs.find({ userId }).sort({ likedAt: -1 }).lean().catch(() => [])
}

async function getLikedSongsCount(userId) {
  return LikedSongs.countDocuments({ userId }).catch(() => 0)
}

// ── UI ──────────────────────────────────────────────────────────────────────

// Embed del toggle like/unlike (réplica del "Added/Removed from Liked Songs" de Soundy)
function buildLikeEmbed({ liked, meta }) {
  const embed = new EmbedBuilder()
    .setColor(liked ? PRIMARY : NEUTRAL)
    .setTitle(`${HEART} ${liked ? 'Añadida a favoritos' : 'Quitada de favoritos'}`)
    .setDescription(`🎵 **[${meta.title}](${meta.uri})**\n🎤 \`${meta.author}\``)
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
      .setAuthor({ name: `${HEART} Favoritos de ${user.username}`, iconURL: user.displayAvatarURL?.() })
      .setDescription(desc)
      .setFooter({ text: `Página ${Math.floor(i / PER_PAGE) + 1} • Mostrando ${i + 1}-${Math.min(i + PER_PAGE, songs.length)} de ${totalCount}` })
      .setTimestamp()
    if (slice[0]?.artworkUrl) embed.setThumbnail(slice[0].artworkUrl)
    pages.push(embed)
  }
  return pages
}

function buildLikedRows(page, totalPages) {
  if (totalPages <= 1) return []
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lk_prev:${page}`).setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId('lk_close').setLabel('Cerrar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`lk_next:${page}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages),
  )]
}

module.exports = {
  trackKey, trackMeta, isTrackLiked, toggleLike, getLikedSongs, getLikedSongsCount,
  buildLikeEmbed, buildLikedPages, buildLikedRows,
}
