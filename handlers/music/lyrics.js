// Shared recording-aware lyrics lookup for Discord and the dashboard.
const https = require('https')
const { requestJson } = require('./lyrics-http')

async function fetchLavalinkLyrics(options) {
  const { node, encoded, lyricsPlugin } = options
  if (!lyricsPlugin || !encoded || !node?.rest?.fetch) return null
  const data = await node.rest.fetch({ endpoint: `/lyrics?track=${encodeURIComponent(encoded)}`, options: {} })
  const rawLines = Array.isArray(data?.lines) ? data.lines : []
  const lines = rawLines.map(line => ({ ms: Number(line.timestamp), text: String(line.line ?? '').trim() }))
    .filter(line => Number.isFinite(line.ms) && line.ms >= 0).sort((a, b) => a.ms - b.ms)
  const plain = typeof data?.text === 'string' ? data.text : lines.map(line => line.text).join('\n')
  return lines.some(line => line.text) || plain ? { lines, plain } : null
}

function recordingKey(title, artist, options) {
  return JSON.stringify([title?.toLowerCase() || '', artist?.toLowerCase() || '',
    options.durationMs || 0, options.albumName || '', options.node?.name || '', options.encoded || '', Boolean(options.lyricsPlugin)])
}

function cleanTitle(title, artist) {
  const clean = title.replace(/\([^)]*(?:official|lyric(?:s)? video)[^)]*\)|\[[^\]]*(?:official|lyric(?:s)? video)[^\]]*\]/gi, '').trim()
  return artist && clean.toLowerCase().startsWith(`${artist.toLowerCase()} - `) ? clean.slice(artist.length + 3).trim() : clean
}

const CACHE = new Map() // Recording signature → bounded provider result
const CACHE_TTL = 1000 * 60 * 30  // 30 min

function httpsGet(url) {
  return requestJson(https, { ...require('node:url').urlToHttpOptions(new URL(url)), headers: { 'User-Agent': 'OBEY-Bot/1.0' } })
}

// Parse LRC format: [mm:ss.xx] text
function parseLrc(lrc) {
  if (!lrc || typeof lrc !== 'string') return []
  const lines = []
  for (const raw of lrc.split('\n')) {
    const timestamps = raw.match(/^(?:\[\d+:\d+(?:\.\d+)?\])+/)?.[0]
    if (!timestamps) continue
    const text = raw.slice(timestamps.length).trim()
    for (const match of timestamps.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)) {
      lines.push({ ms: Math.round((Number(match[1]) * 60 + Number(match[2])) * 1000), text })
    }
  }
  return lines.sort((a, b) => a.ms - b.ms)
}

// Devuelve { lines: [{ms, text}], plain: 'raw text' } o null.
// Orden: plugin Lavalink (sincronizadas) → lrclib.net
async function lookupLyrics(title, artist, options) {
  if (!title) return null

  const cacheKey = recordingKey(title, artist, options)
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < (cached.ttl || CACHE_TTL)) return cached.data

  let unavailable = false
  let result = await fetchLavalinkLyrics(options).catch(() => null)

  if (!result?.lines?.length) {
    const normalizedArtist = String(artist || '').replace(/\s+-\s+Topic$/i, '').trim()
    const q = new URLSearchParams({ track_name: cleanTitle(title, normalizedArtist), artist_name: normalizedArtist })
    const duration = Number(options.durationMs) / 1000
    if (duration >= 1 && duration <= 3600) q.set('duration', String(duration))
    if (options.albumName) q.set('album_name', options.albumName)
    try {
      const data  = await httpsGet(`https://lrclib.net/api/get?${q}`)
      const matches = !Number.isFinite(Number(data.duration)) || !duration || Math.abs(Number(data.duration) - duration) <= 2
      const lines = matches ? parseLrc(data.syncedLyrics) : []
      const plain = matches ? data.plainLyrics || null : null
      const lrclib = lines.length ? { lines, plain } : plain ? { lines: [], plain } : null
      // Preferir el que tenga líneas sincronizadas; si ninguno, el que tenga texto
      if (lrclib?.lines?.length || !result) result = lrclib || result
    } catch (error) { unavailable = !/^lyrics HTTP 404$/.test(error.message) }
  }

  if (CACHE.size >= 256 && !CACHE.has(cacheKey)) CACHE.delete(CACHE.keys().next().value)
  CACHE.set(cacheKey, { data: result || null, status: result ? 'ready' : unavailable ? 'unavailable' : 'missing', ttl: unavailable && !result ? 10000 : CACHE_TTL, fetchedAt: Date.now() })
  return result || null
}

const pendingLookups = new Map()
async function fetchLyrics(title, artist, options = {}) {
  if (!title) return null
  const key = recordingKey(title, artist, options)
  if (!pendingLookups.has(key)) {
    const pending = lookupLyrics(title, artist, options).finally(() => pendingLookups.delete(key))
    pendingLookups.set(key, pending)
  }
  return pendingLookups.get(key)
}
async function fetchLyricsResult(title, artist, options = {}) {
  const data = await fetchLyrics(title, artist, options)
  const key = recordingKey(title, artist, options)
  return { data, status: data ? 'ready' : CACHE.get(key)?.status || 'missing' }
}

// Get the current line + context (prev, current, next) based on position
function getLyricContext(lines, positionMs) {
  if (!lines?.length) return null
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].ms <= positionMs) idx = i
    else break
  }
  return {
    prev:    idx > 0           ? lines[idx - 1] : null,
    current: lines[idx] || null,
    next:    idx < lines.length - 1 ? lines[idx + 1] : null,
    index:   idx,
    total:   lines.length,
  }
}

// Format lyrics for Discord embed — shows current line ±2 context lines
function formatLyricsEmbed(lines, positionMs) {
  if (!lines?.length) return null
  const { index } = getLyricContext(lines, positionMs) || { index: 0 }
  const start = Math.max(0, index - 2)
  const end   = Math.min(lines.length, index + 3)
  return lines.slice(start, end).map((l, i) => {
    const isActive = start + i === index
    return isActive ? `**› ${l.text}**` : `  ${l.text}`
  }).join('\n')
}

module.exports = { fetchLyrics, fetchLyricsResult, getLyricContext, formatLyricsEmbed, parseLrc }
