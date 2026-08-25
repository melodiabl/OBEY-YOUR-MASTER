// Lyrics: plugin java-timed-lyrics de Lavalink (YouTube Music, sincronizadas)
// con fallback a lrclib.net (free, no auth)
const https = require('https')
const http  = require('http')

const LAVALINK = {
  host: process.env.LAVALINK_HOST || '127.0.0.1',
  port: Number(process.env.LAVALINK_PORT || 2333),
  auth: process.env.LAVALINK_PASSWORD || '',
}

function lavalinkGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: LAVALINK.host, port: LAVALINK.port, path, headers: { Authorization: LAVALINK.auth }, timeout: 8000 }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
        try { resolve(JSON.parse(body)) } catch { reject(new Error('invalid JSON')) }
      })
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
  })
}

// java-timed-lyrics: GET /v4/lyrics/search?query=… → { lines: [{line, range:{start,end}}], text }
async function fetchLavalinkLyrics(title, artist) {
  const query = encodeURIComponent(`${title} ${artist || ''}`.trim())
  const data  = await lavalinkGet(`/v4/lyrics/search?query=${query}`)
  const rawLines = data?.lines || data?.data?.lines || []
  const lines = rawLines
    .map(l => ({ ms: Number(l.range?.start ?? l.timestamp ?? NaN), text: String(l.line || l.text || '').trim() }))
    .filter(l => Number.isFinite(l.ms) && l.text)
    .sort((a, b) => a.ms - b.ms)
  const plain = data?.text || (rawLines.length ? rawLines.map(l => l.line || l.text).join('\n') : null)
  if (!lines.length && !plain) return null
  return { lines, plain }
}

const CACHE = new Map()   // `${title}::${artist}` → { lines, fetchedAt }
const CACHE_TTL = 1000 * 60 * 30  // 30 min

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'OBEY-Bot/1.0' } }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
        try { resolve(JSON.parse(body)) } catch { reject(new Error('invalid JSON')) }
      })
    }).on('error', reject)
  })
}

// Parse LRC format: [mm:ss.xx] text
function parseLrc(lrc) {
  if (!lrc || typeof lrc !== 'string') return []
  const lines = []
  for (const raw of lrc.split('\n')) {
    const m = raw.match(/^\[(\d+):(\d+\.?\d*)\]\s*(.*)/)
    if (!m) continue
    const ms = (parseInt(m[1]) * 60 + parseFloat(m[2])) * 1000
    const text = m[3].trim()
    if (text) lines.push({ ms, text })
  }
  return lines.sort((a, b) => a.ms - b.ms)
}

// Devuelve { lines: [{ms, text}], plain: 'raw text' } o null.
// Orden: plugin Lavalink (sincronizadas) → lrclib.net
async function fetchLyrics(title, artist) {
  if (!title) return null

  const cacheKey = `${title.toLowerCase()}::${artist?.toLowerCase() || ''}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data

  let result = await fetchLavalinkLyrics(title, artist).catch(() => null)

  if (!result?.lines?.length) {
    const q = new URLSearchParams({ track_name: title, artist_name: artist || '' })
    try {
      const data  = await httpsGet(`https://lrclib.net/api/get?${q}`)
      const lines = parseLrc(data.syncedLyrics)
      const plain = data.plainLyrics || null
      const lrclib = lines.length ? { lines, plain } : plain ? { lines: [], plain } : null
      // Preferir el que tenga líneas sincronizadas; si ninguno, el que tenga texto
      if (lrclib?.lines?.length || !result) result = lrclib || result
    } catch {}
  }

  CACHE.set(cacheKey, { data: result || null, fetchedAt: Date.now() })
  return result || null
}

// Get the current line + context (prev, current, next) based on position
function getLyricContext(lines, positionMs) {
  if (!lines?.length) return null
  let idx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].ms <= positionMs) idx = i
    else break
  }
  return {
    prev:    idx > 0           ? lines[idx - 1] : null,
    current: lines[idx],
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

module.exports = { fetchLyrics, getLyricContext, formatLyricsEmbed, parseLrc }
