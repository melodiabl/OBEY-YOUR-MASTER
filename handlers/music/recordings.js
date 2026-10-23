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
function isYouTubeChannel(track) {
  const info = infoFor(track), url = youtubeURL(info.uri || info.url)
  return Boolean(url && /^\/(?:channel\/|user\/|c\/|@)/i.test(url.pathname))
}
function hasUnrequestedVersion(track, query) {
  return VERSION_MARKERS.some(marker => marker.test(infoFor(track).title || '') && !marker.test(query || ''))
}
function recordingPreference(track, query) {
  const info = infoFor(track)
  let score = hasUnrequestedVersion(track, query) ? -180 : 0
  if (info.isrc || track?.pluginInfo?.isrc) score += 25
  if (/^(?:spotify|applemusic)$/i.test(info.sourceName || '')) score += 30
  if (/(?:\s+-\s+Topic|VEVO)$/i.test(info.author || '')) score += 25
  if (/\bofficial (?:audio|video|music video)\b/i.test(info.title || '')) score += 20
  return score
}
function rankMusicTracks(tracks, query) {
  const normalizedQuery = text(String(query || '').replace(/^(?:ytsearch|ytmsearch|spsearch|amsearch):/i, ''))
  const tokens = [...new Set(normalizedQuery.split(' ').filter(Boolean))]
  const rows = tracks.filter(track => {
    const title = String(infoFor(track).title || '')
    const annotations = (title.match(/\([^)]*\)|\[[^\]]*\]|\s[-|]\s(?:live|cover|karaoke|remix|nightcore|slowed|sped)[^|]*/gi) || []).join(' ')
    return !isYouTubeShort(track) && !isYouTubeChannel(track) && !hasUnrequestedVersion({ info: { title: annotations } }, query)
  }).map((track, index) => {
    const info = infoFor(track), title = text(info.title), words = text(`${info.title || ''} ${info.author || ''}`).split(' ')
    const matches = tokens.filter(token => words.includes(token)).length
    const relevance = tokens.length ? matches / tokens.length * 1000 : 0
    return { track, index, matches, artist: recordingArtist(info.author), score: relevance + (title === normalizedQuery ? 120 : 0) + recordingPreference(track, query) }
  })
  // Several distinct recordings credited to the exact query identify an artist
  // search. Do not pad that list with unrelated artists or homonymous titles.
  const exactArtistTitles = new Set(rows.filter(row => row.artist === normalizedQuery).map(row => recordingTitle(infoFor(row.track))))
  const artistSearch = Boolean(normalizedQuery && exactArtistTitles.size >= 2)
  const namedArtists = new Set(rows.filter(row => {
    const info = infoFor(row.track), title = recordingTitle(info).split(' ').filter(Boolean)
    return /^(?:spotify|applemusic)$/i.test(info.sourceName || '') && row.artist && title.length &&
      row.artist.split(' ').every(word => tokens.includes(word)) && title.every(word => tokens.includes(word))
  }).map(row => row.artist))
  const artist = artistSearch ? normalizedQuery : namedArtists.size === 1 ? [...namedArtists][0] : null
  const ranked = rows.filter(row => (!tokens.length || row.matches >= Math.ceil(tokens.length * 0.7)) &&
    (!artist || row.artist === artist || String(infoFor(row.track).author || '')
      .split(/\s+(?:feat\.?|ft\.?|with|and|x)\s+|[,/&]/i).some(credit => recordingArtist(credit) === artist)))
    .sort((a, b) => b.score - a.score || a.index - b.index)
  const result = []
  for (const { track } of ranked) {
    // Group a song's album editions/videos in discovery. Playback matching below
    // remains stricter about duration and ISRC when resolving on another node.
    if (!result.some(existing => infoFor(existing).uri && infoFor(existing).uri === infoFor(track).uri || sameRecording(existing, track) ||
      recordingTitle(infoFor(existing)) && recordingTitle(infoFor(existing)) === recordingTitle(infoFor(track)) &&
      recordingArtist(infoFor(existing).author) === recordingArtist(infoFor(track).author))) result.push(track)
  }
  return result
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

module.exports = { isYouTubeShort, isYouTubeChannel, hasUnrequestedVersion, recordingPreference, rankMusicTracks, sameRecording, recordingArtist, recordingTitle }
