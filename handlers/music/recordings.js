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
  const catalogArtists = new Set(tracks.filter(track => /^(?:spotify|applemusic)$/i.test(infoFor(track).sourceName || '')).map(track => recordingArtist(infoFor(track).author)))
  const rows = tracks.filter(track => {
    const title = String(infoFor(track).title || '')
    const annotations = (title.match(/\([^)]*\)|\[[^\]]*\]|\s[-|]\s(?:live|cover|karaoke|remix|nightcore|slowed|sped)[^|]*/gi) || []).join(' ')
    return !isYouTubeShort(track) && !isYouTubeChannel(track) && !hasUnrequestedVersion({ info: { title: annotations } }, query)
  }).map((track, index) => {
    const info = infoFor(track)
    let title = recordingTitle(info), artist = recordingArtist(info.author)
    // A trusted catalog credit can identify the artist prefix of a YouTube
    // upload. That prefix is not part of the song's title.
    const upload = /^(?:youtube|ytmusic|youtubemusic|ytdlp)$/i.test(info.sourceName || '') && String(info.title || '').match(/^(.+?)\s+[-–—|]\s+(.+)$/)
    if (upload && catalogArtists.has(recordingArtist(upload[1]))) {
      artist = recordingArtist(upload[1]); title = recordingTitle({ title: upload[2], author: upload[1] })
    }
    const titleWords = title.split(' '), artistWords = artist.split(' ')
    const matchesWord = (words, token) => words.some(word => word === token || token.length >= 3 && word.startsWith(token))
    const titleMatches = tokens.filter(token => matchesWord(titleWords, token)).length
    const matches = tokens.filter(token => matchesWord(titleWords, token) || matchesWord(artistWords, token)).length
    const exactTitle = normalizedQuery && (title === normalizedQuery || title.replaceAll(' ', '') === normalizedQuery.replaceAll(' ', ''))
    const songTokens = tokens.filter(token => !artistWords.includes(token))
    const creditedTitle = artistWords.some(Boolean) && artistWords.every(word => tokens.includes(word)) &&
      songTokens.length > 0 && songTokens.every(token => matchesWord(titleWords, token))
    // Match evidence decides the tier; provider bonuses cannot turn an
    // author-only hit into a better title match.
    const tier = creditedTitle ? 3400 : exactTitle ? 3000
      : tokens.length && titleMatches === tokens.length ? 2400
      : tokens.length && matches === tokens.length && titleMatches > 0 ? 2000
      : titleMatches > 0 ? 1500
      : artist === normalizedQuery ? 1200 : 900
    const coverage = tokens.length ? matches / tokens.length : 0
    const titleCoverage = tokens.length ? titleMatches / tokens.length : 0
    return { track, index, matches, exactTitle, score: tier + coverage * 100 + titleCoverage * 200 + recordingPreference(track, query) }
  })
  const ranked = rows.filter(row => !tokens.length || row.exactTitle || row.matches >= Math.ceil(tokens.length * 0.7))
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
function preferredCatalogTab(result, query) {
  const phrase = text(String(query || '').replace(/^(?:ytsearch|ytmsearch|spsearch|amsearch):/i, ''))
  const exact = value => phrase && text(value).replaceAll(' ', '') === phrase.replaceAll(' ', '')
  const tokens = phrase.split(' ').filter(Boolean)
  const combined = item => {
    const info = infoFor(item), words = text(`${recordingTitle(info)} ${info.author || ''}`).split(' ').filter(Boolean)
    return tokens.length > 0 && info.author && tokens.every(token => words.includes(token)) && words.every(word => tokens.includes(word))
  }
  if (result.tracks?.some(track => exact(recordingTitle(infoFor(track))))) return 'tracks'
  if (result.albums?.some(album => exact(infoFor(album).title))) return 'albums'
  if (result.artists?.some(artist => exact(artist.title))) return 'artists'
  if (result.tracks?.some(combined)) return 'tracks'
  if (result.albums?.some(combined)) return 'albums'
  return ['tracks', 'albums', 'artists'].find(kind => result[kind]?.length) || 'tracks'
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

module.exports = { isYouTubeShort, isYouTubeChannel, hasUnrequestedVersion, recordingPreference, rankMusicTracks, preferredCatalogTab, sameRecording, recordingArtist, recordingTitle }
