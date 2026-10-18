const YOUTUBE_HOST = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)$/i
const VERSION_MARKERS = [
  /\bcover\b/i, /\bkaraoke\b/i, /\bremix(?:ed)?\b/i, /\bnightcore\b/i,
  /\b(?:sped|speed)[ -]?up\b/i, /\bslowed\b/i, /\breverb\b/i,
  /\b(?:live|en vivo|concert)\b/i, /\b(?:8d|bass boosted)\b/i,
]
const infoFor = track => track?.info || track || {}
function text(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}
function youtubeURL(value) {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && YOUTUBE_HOST.test(url.hostname) ? url : null } catch { return null }
}
function isYouTubeShort(track) {
  if (typeof track === 'string') return /^\/shorts(?:\/|$)/i.test(youtubeURL(track)?.pathname || '')
  const info = infoFor(track), plugin = track?.pluginInfo || info.pluginInfo || {}, url = youtubeURL(info.uri || info.url)
  const youtube = url || /^(?:youtube|ytmusic|youtubemusic)$/i.test(info.sourceName || '')
  return Boolean(youtube && (isYouTubeShort(info.uri || info.url || '') ||
    info.isShort === true || info.isShorts === true || plugin.isShort === true || plugin.isShorts === true ||
    /(?:^|\s)#shorts?\b/i.test(info.title || '')))
}
function hasUnrequestedVersion(track, query) {
  return VERSION_MARKERS.some(marker => marker.test(infoFor(track).title || '') && !marker.test(query || ''))
}
function recordingPreference(track, query) {
  const info = infoFor(track)
  let score = hasUnrequestedVersion(track, query) ? -180 : 0
  if (info.isrc || track?.pluginInfo?.isrc) score += 25
  if (/^(?:spotify|applemusic|deezer|tidal|qobuz)$/i.test(info.sourceName || '')) score += 30
  if (/(?:\s+-\s+Topic|VEVO)$/i.test(info.author || '')) score += 25
  if (/\bofficial (?:audio|video|music video)\b/i.test(info.title || '')) score += 20
  return score
}
function rankMusicTracks(tracks, query) {
  const normalizedQuery = text(String(query || '').replace(/^(?:ytsearch|ytmsearch|spsearch|scsearch|jssearch|amsearch|dzsearch):/i, ''))
  const tokens = [...new Set(normalizedQuery.split(' ').filter(Boolean))]
  return tracks.filter(track => !isYouTubeShort(track)).map((track, index) => {
    const info = infoFor(track), title = text(info.title), words = text(`${info.title || ''} ${info.author || ''}`).split(' ')
    const matches = tokens.filter(token => words.includes(token)).length
    const relevance = tokens.length ? matches / tokens.length * 1000 : 0
    return { track, index, score: relevance + (title === normalizedQuery ? 120 : 0) + recordingPreference(track, query) }
  }).sort((a, b) => b.score - a.score || a.index - b.index).map(row => row.track)
}
function recordingTitle(info) {
  const title = text(String(info.title || '')
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (_, round, square) => {
      const label = (round ?? square).replace(/\b(?:official(?:\s+music)?(?:\s+(?:audio|video))?|music video|audio|video|lyrics?|visualizer)\b/gi, '').trim()
      return label ? `(${label})` : ' '
    }).replace(/\s+official (?:music )?(?:audio|video)\s*$/i, ''))
  const artist = recordingArtist(info.author)
  return artist && title.startsWith(artist + ' ') ? title.slice(artist.length + 1) : title
}
function recordingArtist(author) {
  return text(String(author || '').replace(/\s+-\s+Topic$|VEVO$/i, ''))
}
function sameRecording(reference, candidate) {
  if (isYouTubeShort(candidate)) return false
  const a = infoFor(reference), b = infoFor(candidate)
  const aIsrc = text(a.isrc || reference?.pluginInfo?.isrc), bIsrc = text(b.isrc || candidate?.pluginInfo?.isrc)
  if (aIsrc && bIsrc && aIsrc !== bIsrc) return false
  const aLength = Number(a.length || a.durationMs || 0), bLength = Number(b.length || b.durationMs || 0)
  if (aLength > 0 && bLength > 0 && Math.abs(aLength - bLength) > Math.max(5000, aLength * 0.06)) return false
  if (a.uri && a.uri === b.uri) return true
  if (aIsrc && aIsrc === bIsrc) return true
  const title = recordingTitle(a), artist = recordingArtist(a.author), otherArtist = recordingArtist(b.author)
  return Boolean(title && artist && otherArtist && title === recordingTitle(b) &&
    (artist.replaceAll(' ', '') === otherArtist.replaceAll(' ', '') ||
      ` ${artist} `.includes(` ${otherArtist} `) || ` ${otherArtist} `.includes(` ${artist} `)))
}

module.exports = { isYouTubeShort, hasUnrequestedVersion, recordingPreference, rankMusicTracks, sameRecording }
