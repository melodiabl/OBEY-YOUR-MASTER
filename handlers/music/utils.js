// Shared utility functions for the music system

// GIF animado de disco girando para el author de los embeds de música (estilo Lara/Beatra).
// CDN directo — no auto-hospedado.
const MUSIC_ICON = 'https://cdn.darrennathanael.com/icons/spinning_disk.gif'

function cleanText(value, fallback = '') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function clampMs(value, total = 0) {
  const ms = Math.max(0, Number(value || 0))
  return total > 0 ? Math.min(total, ms) : ms
}

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

function progressBar(current, total, len = 17) {
  if (!total || total <= 0) return '▱'.repeat(len)
  const filled = Math.min(len, Math.round((current / total) * len))
  return '▰'.repeat(filled) + '▱'.repeat(len - filled)
}

function platform(uri = '', sourceName = '') {
  const src = sourceName.toLowerCase()
  if (src === 'spotify'    || /spotify/i.test(uri))                  return { name: 'Spotify',     color: 0x1DB954, emoji: '🟢' }
  if (src === 'applemusic' || /applemusic|apple.?music/i.test(uri))  return { name: 'Apple Music', color: 0xFA243C, emoji: '🍎' }
  if (src === 'soundcloud' || /soundcloud/i.test(uri))               return { name: 'SoundCloud',  color: 0xFF5500, emoji: '🟠' }
  if (src === 'deezer'     || /deezer/i.test(uri))                   return { name: 'Deezer',      color: 0xEF5466, emoji: '🎵' }
  if (src === 'jiosaavn'   || /jiosaavn/i.test(uri))                 return { name: 'JioSaavn',    color: 0x2BC5B4, emoji: '🎵' }
  if (src === 'twitch'     || /twitch/i.test(uri))                   return { name: 'Twitch',      color: 0x9146FF, emoji: '🟣' }
  if (src === 'bandcamp'   || /bandcamp/i.test(uri))                 return { name: 'Bandcamp',    color: 0x1da0c3, emoji: '🔵' }
  return                                                                      { name: 'YouTube',    color: 0xFF0000, emoji: '🔴' }
}

function loopEmoji(loop) {
  if (loop === 'track') return '🔂'
  if (loop === 'queue') return '🔁'
  return '➡️'
}

function volEmoji(vol) {
  if (vol === 0) return '🔇'
  if (vol < 40)  return '🔉'
  return '🔊'
}

function filterLabel(f) {
  const m = {
    bassboost:'Bass Boost', nightcore:'Nightcore', '8d':'8D', vaporwave:'Vaporwave',
    lofi:'Lo-Fi', slowed:'Slowed', crystal:'Crystal', metal:'Metal',
    pop:'Pop', soft:'Soft', tremolo:'Tremolo', vibrato:'Vibrato',
  }
  return m[f] || null
}

function trackInfo(track) {
  const info = track?.info || track || {}
  const pluginInfo = track?.pluginInfo || info.pluginInfo || {}
  return { info, pluginInfo }
}

function normalizePublicTrack(track, extra = {}) {
  const { info, pluginInfo } = trackInfo(track)
  const sourceName = cleanText(
    info.catalogSourceName || info.sourceName || pluginInfo.sourceName || extra.sourceName,
    'youtube',
  ).toLowerCase()
  const uri = cleanText(info.catalogUri || info.uri || info.url || pluginInfo.uri || pluginInfo.url)
  const artworkUrl = cleanText(
    info.artworkUrl || info.thumbnail || pluginInfo.artworkUrl || pluginInfo.thumbnail || extra.artworkUrl,
  ) || null

  return {
    type:        extra.type || 'track',
    pos:         extra.pos,
    title:       cleanText(info.title  || info.name    || extra.title,  'Sin titulo'),
    author:      cleanText(info.author || pluginInfo.author || pluginInfo.artist || extra.author, 'Artista desconocido'),
    uri,
    artworkUrl,
    length:      Number(info.length || info.durationMs || pluginInfo.durationMs || extra.length || 0),
    elapsed:     Number(extra.elapsed || 0),
    requester:   cleanText(info.requester || pluginInfo.requester || extra.requester),
    sourceName,
    albumName:   cleanText(info.albumName   || pluginInfo.albumName  || pluginInfo.album   || extra.albumName) || null,
    albumUrl:    cleanText(pluginInfo.albumUrl  || pluginInfo.albumUri  || extra.albumUrl)  || null,
    artistUrl:   cleanText(pluginInfo.artistUrl || pluginInfo.artistUri || extra.artistUrl) || null,
    releaseDate: cleanText(info.releaseDate  || pluginInfo.releaseDate  || extra.releaseDate) || null,
    isrc:        cleanText(info.isrc || pluginInfo.isrc || extra.isrc) || null,
    identifier:  cleanText(info.identifier || extra.identifier) || null,
    isStream:    Boolean(info.isStream || extra.isStream),
    isSeekable:  info.isSeekable !== false,
  }
}

function tracksFromResolve(res) {
  if (!res?.data || ['error','empty'].includes(res.loadType)) return []
  if (res.loadType === 'track')               return [res.data]
  if (['playlist','album'].includes(res.loadType)) return res.data?.tracks || []
  if (['search','SHORT'].includes(res.loadType))   return Array.isArray(res.data) ? res.data : []
  return []
}

module.exports = {
  cleanText, clampMs, fmtMs, progressBar, platform,
  loopEmoji, volEmoji, filterLabel, trackInfo,
  normalizePublicTrack, tracksFromResolve, MUSIC_ICON,
}
