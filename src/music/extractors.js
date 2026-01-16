const fs = require('node:fs/promises')
const path = require('node:path')
const { SpotifyExtractor } = require('@discord-player/extractor')
// eslint-disable-next-line n/no-missing-require
const { YoutubeiExtractor } = require('discord-player-youtubei')

function setYoutubeiLogLevel () {
  const desired = String(process.env.YOUTUBEI_LOG_LEVEL || 'ERROR').trim().toUpperCase()

  function applyLevel (yt) {
    if (!yt?.Log?.setLevel || !yt?.Log?.Level) return false
    const level = yt.Log.Level[desired] ?? yt.Log.Level.ERROR
    yt.Log.setLevel(level)
    return true
  }

  try { applyLevel(require('youtubei.js')) } catch {}

  // discord-player-youtubei suele traer su propia copia de youtubei.js (v14) y loggea mucho en consola.
  // Cargamos el bundle directamente para bajar el nivel de logs (por default: ERROR).
  try {
    const nested = path.resolve(process.cwd(), 'node_modules', 'discord-player-youtubei', 'node_modules', 'youtubei.js', 'bundle', 'node.cjs')
    // eslint-disable-next-line n/no-missing-require
    applyLevel(require(nested))
  } catch {}
}

function normalizeLang (input) {
  const raw = String(input || '').trim()
  if (!raw) return null
  const normalized = raw.replace(/_/g, '-').toLowerCase()
  // Normalize region if provided (es-es -> es-ES)
  const [lang, region] = normalized.split('-')
  if (!lang) return null
  if (!region) return lang
  return `${lang}-${region.toUpperCase()}`
}

function cookiePairsToHeader (pairs) {
  const map = new Map()
  for (const [name, value] of pairs) {
    const n = String(name || '').trim()
    const v = String(value || '').trim()
    if (!n || !v) continue
    map.set(n, v)
  }
  return Array.from(map.entries()).map(([n, v]) => `${n}=${v}`).join('; ')
}

function parseCookieHeaderFromNetscape (content) {
  const pairs = []
  const lines = String(content || '').split(/\r?\n/)
  for (const line of lines) {
    const l = line.trim()
    if (!l || l.startsWith('#')) continue
    const parts = l.split('\t')
    // domain \t flag \t path \t secure \t expiration \t name \t value
    if (parts.length >= 7) pairs.push([parts[5], parts[6]])
  }
  return cookiePairsToHeader(pairs)
}

function parseCookieHeaderFromJson (jsonValue) {
  const pairs = []

  let cookies = null
  if (Array.isArray(jsonValue)) cookies = jsonValue
  else if (Array.isArray(jsonValue?.cookies)) cookies = jsonValue.cookies
  else if (Array.isArray(jsonValue?.Cookies)) cookies = jsonValue.Cookies

  if (!cookies) return null

  for (const c of cookies) {
    const name = c?.name ?? c?.Name
    const value = c?.value ?? c?.Value
    if (!name || !value) continue
    pairs.push([name, value])
  }

  const header = cookiePairsToHeader(pairs)
  return header || null
}

async function resolveYouTubeCookieHeader () {
  const direct = process.env.YOUTUBE_COOKIE || process.env.DP_YOUTUBE_COOKIE
  if (direct) {
    const raw = String(direct).trim()
    if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
      try {
        const parsed = JSON.parse(raw)
        const header = parseCookieHeaderFromJson(parsed)
        if (header) return header
      } catch {}
    }
    return raw
  }

  const cookieFile = process.env.YOUTUBE_COOKIE_FILE || process.env.DP_YOUTUBE_COOKIE_FILE
  if (!cookieFile) return undefined

  const filePath = path.isAbsolute(cookieFile) ? cookieFile : path.resolve(process.cwd(), cookieFile)
  const content = await fs.readFile(filePath, 'utf8')
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.json') {
    const header = parseCookieHeaderFromJson(JSON.parse(content))
    if (header) return header
    return undefined
  }

  if (content.includes('\t')) {
    const header = parseCookieHeaderFromNetscape(content)
    if (header) return header
  }

  const trimmed = String(content || '').trim()
  if (trimmed.includes('=') && trimmed.includes(';')) return trimmed

  return undefined
}

async function registerExtractors (player) {
  if (player.__extractorsInstalled) return

  try {
    setYoutubeiLogLevel()

    // IMPORTANT: no usar process.env.LANGUAGE directo (en este proyecto es "ES" y rompe youtubei.js -> 400).
    const ytLang = normalizeLang(process.env.YOUTUBE_LANG) || normalizeLang(process.env.LANGUAGE) || 'en'
    const ytLocation = String(process.env.YOUTUBE_LOCATION || 'US').trim().toUpperCase()
    const allowCookie = String(process.env.YOUTUBE_USE_COOKIES || '').trim() === '1'

    // YouTube (discord-player-youtubei) - sin ytdl-core
    const streamClient = String(process.env.YOUTUBE_STREAM_CLIENT_TYPE || 'WEB').toUpperCase()
    const baseClient = String(process.env.YOUTUBE_CLIENT_TYPE || 'WEB').toUpperCase()
    const ytCookie = (streamClient === 'WEB' || allowCookie) ? await resolveYouTubeCookieHeader() : undefined

    const generateWithPoToken = String(process.env.YOUTUBE_GENERATE_PO_TOKEN || '').trim() === '1'
    const useServerAbrStream = String(process.env.YOUTUBE_USE_SERVER_ABR || '').trim() === '1'
    const disablePlayer = String(process.env.YOUTUBE_DISABLE_PLAYER || '').trim() === '1'

    await player.extractors.register(YoutubeiExtractor, {
      cookie: ytCookie,
      authentication: process.env.YOUTUBE_AUTHENTICATION || undefined,
      overrideBridgeMode: process.env.YOUTUBE_BRIDGE_MODE || undefined,
      generateWithPoToken,
      useServerAbrStream,
      disablePlayer,
      streamOptions: {
        useClient: streamClient,
        highWaterMark: 1 << 25
      },
      innertubeConfigRaw: {
        lang: ytLang,
        location: ytLocation,
        client_type: baseClient,
        retrieve_player: !disablePlayer
      }
    })

    // Spotify (solo metadata). El stream se resuelve via bridge (YouTubeiExtractor.bridge).
    await player.extractors.register(SpotifyExtractor, {
      clientId: process.env.SPOTIFY_CLIENT_ID || process.env.DP_SPOTIFY_CLIENT_ID || null,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || process.env.DP_SPOTIFY_CLIENT_SECRET || null
    })

    player.__extractorsInstalled = true

    // eslint-disable-next-line no-console
    console.log('[Music] Extractors: YouTube(discord-player-youtubei) + Spotify(metadata->bridge)')
  } catch (e) {
    player.__extractorsInstalled = false
    throw e
  }
}

module.exports = { registerExtractors }
