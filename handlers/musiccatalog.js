const axios = require('axios')

const SOURCE_DEFINITIONS = {
  youtube:    { prefix: 'ytsearch',  label: 'YouTube' },
  ytmusic:    { prefix: 'ytmsearch', label: 'YouTube Music' },
  spotify:    { prefix: 'spsearch',  label: 'Spotify' },
  deezer:     { prefix: 'dzsearch',  label: 'Deezer' },
  applemusic: { prefix: 'amsearch',  label: 'Apple Music' },
  tidal:      { prefix: 'tdsearch',  label: 'Tidal' },
  qobuz:      { prefix: 'qbsearch',  label: 'Qobuz' },
  jiosaavn:   { prefix: 'jssearch',  label: 'JioSaavn' },
  yandex:     { prefix: 'ymsearch',  label: 'Yandex Music' },
}

const DEFAULT_SOURCE_ORDER = ['spotify', 'ytmusic', 'youtube', 'applemusic']

const ADVANCED_SOURCE_ORDER = ['spotify', 'ytmusic', 'youtube', 'applemusic']

const LEO_API_BASE = 'http://140.245.242.153:8081'

const collectionResolveCache = new Map()

const COLLECTION_URI_PREFIX = 'obey:collection:'

function cleanText(value, fallback = '') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function trackKey(track) {
  return track.isrc || track.uri || `${track.title.toLowerCase()}::${track.author.toLowerCase()}::${track.length}`
}

function collectionKey(item) {
  return item.uri || `${item.type}::${item.title.toLowerCase()}::${item.author.toLowerCase()}`
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  return items.filter(item => {
    const key = keyFn(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function searchableText(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function relevanceScore(item, query, index, duplicateCount = 1) {
  const queryText = searchableText(query)
  const queryCompact = queryText.replace(/\s+/g, '')
  const title = searchableText(item.title)
  const titleCompact = title.replace(/\s+/g, '')
  const author = searchableText(item.author)
  const haystack = `${title} ${author}`.trim()
  const tokens = queryText.split(/\s+/).filter(Boolean)
  let score = Math.max(0, 40 - index)

  if (title === queryText) score += 1000
  else if (titleCompact && titleCompact === queryCompact) score += 950
  else if (title.startsWith(queryText)) score += 520
  else if (title.includes(queryText)) score += 340

  if (author === queryText) score += 300
  else if (author.includes(queryText)) score += 160
  for (const token of tokens) {
    if (title.split(' ').includes(token)) score += 80
    else if (title.includes(token)) score += 45
    if (author.includes(token)) score += 30
    if (!haystack.includes(token)) score -= 35
  }

  score += Math.min(240, Math.max(0, duplicateCount - 1) * 90)
  score += Math.min(100, Number(item.popularity || 0))
  if (item.sourceName === 'spotify') score += 25
  return score
}

function rankResults(items, query, keyFn) {
  const counts = new Map()
  for (const item of items) {
    const key = keyFn(item)
    if (key) counts.set(key, (counts.get(key) || 0) + 1)
  }
  return uniqueBy(
    items
      .map((item, index) => ({
        item,
        index,
        score: relevanceScore(item, query, index, counts.get(keyFn(item)) || 1),
      }))
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map(entry => entry.item),
    keyFn,
  )
}

function encodeCollectionPlayUri(collection) {
  const payload = Buffer.from(JSON.stringify({
    type: collection.type,
    title: collection.title,
    author: collection.author,
    sourceName: collection.sourceName,
    uri: collection.uri,
  })).toString('base64url')
  return `${COLLECTION_URI_PREFIX}${payload}`
}

function parseCollectionPlayUri(identifier) {
  const value = cleanText(identifier)
  if (!value.startsWith(COLLECTION_URI_PREFIX)) return null
  try {
    const payload = JSON.parse(Buffer.from(value.slice(COLLECTION_URI_PREFIX.length), 'base64url').toString('utf8'))
    const title = cleanText(payload.title)
    if (!title) return null
    return {
      type: cleanText(payload.type, 'album'),
      title,
      author: cleanText(payload.author, 'Varios artistas'),
      sourceName: cleanText(payload.sourceName, 'youtube').toLowerCase(),
      uri: cleanText(payload.uri),
    }
  } catch {
    return null
  }
}

function collectionNeedsSearchPlayback(collection) {
  if (collection.type !== 'album') return false
  return ['youtube', 'ytmusic', 'applemusic'].includes(collection.sourceName)
}

function normalizeTrack(raw, sourceHint = '') {
  const info = raw?.info || raw || {}
  const pluginInfo = raw?.pluginInfo || info.pluginInfo || {}
  return {
    type: 'track',
    title: cleanText(info.title, 'Sin titulo'),
    author: cleanText(info.author, 'Artista desconocido'),
    length: Number(info.length || info.durationMs || 0),
    uri: cleanText(info.uri || info.url),
    artworkUrl: cleanText(info.artworkUrl || info.thumbnail) || null,
    sourceName: cleanText(info.sourceName || sourceHint, 'youtube').toLowerCase(),
    albumName: cleanText(info.albumName || pluginInfo.albumName || pluginInfo.album) || null,
    releaseDate: cleanText(info.releaseDate || pluginInfo.releaseDate) || null,
    isrc: cleanText(info.isrc || pluginInfo.isrc) || null,
    identifier: cleanText(info.identifier) || null,
    isStream: Boolean(info.isStream),
    isSeekable: info.isSeekable !== false,
    playable: Boolean(info.uri || info.url),
  }
}

function normalizeCollection(raw, type, sourceHint = '') {
  const info = raw?.info || raw || {}
  const pluginInfo = raw?.pluginInfo || info.pluginInfo || {}
  const uri = cleanText(
    info.uri || info.url || pluginInfo.uri || pluginInfo.url || pluginInfo.externalUrl,
  )
  const collection = {
    type,
    title: cleanText(info.name || info.title, type === 'album' ? 'Album' : 'Playlist'),
    author: cleanText(
      info.author || pluginInfo.author || pluginInfo.artist || pluginInfo.owner,
      'Varios artistas',
    ),
    length: Number(info.length || pluginInfo.duration || 0),
    uri,
    artworkUrl: cleanText(
      info.artworkUrl || info.thumbnail || pluginInfo.artworkUrl || pluginInfo.thumbnail,
    ) || null,
    sourceName: cleanText(info.sourceName || pluginInfo.sourceName || sourceHint, 'youtube').toLowerCase(),
    totalTracks: Number(info.totalTracks || pluginInfo.totalTracks || pluginInfo.trackCount || 0),
    releaseDate: cleanText(pluginInfo.releaseDate || info.releaseDate) || null,
    description: cleanText(info.description || pluginInfo.description) || null,
    publisher: cleanText(info.publisher || pluginInfo.publisher || pluginInfo.label) || null,
    playable: Boolean(uri),
  }
  if (collectionNeedsSearchPlayback(collection)) collection.playUri = encodeCollectionPlayUri(collection)
  return collection
}

function normalizeLavaSearchResponse(payload, sourceHint = '') {
  const data = payload?.data || payload || {}
  const tracks = Array.isArray(data.tracks) ? data.tracks.map(item => normalizeTrack(item, sourceHint)) : []
  const albums = Array.isArray(data.albums) ? data.albums.map(item => normalizeCollection(item, 'album', sourceHint)) : []
  const playlists = Array.isArray(data.playlists)
    ? data.playlists.map(item => normalizeCollection(item, 'playlist', sourceHint))
    : []
  return { tracks, albums, playlists }
}

function extractJsonObject(source, marker) {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) return null

  const start = source.indexOf('{', markerIndex + marker.length)
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === '{') depth += 1
    else if (character === '}' && --depth === 0) return JSON.parse(source.slice(start, index + 1))
  }
  return null
}

function parseTrackCount(value) {
  const match = cleanText(value).match(/([\d.,]+)\s+(?:videos|vídeos)/i)
  return match ? Number(match[1].replace(/\D/g, '')) : 0
}

function findPlaylistCount(value) {
  if (!value || typeof value !== 'object') return 0
  if (typeof value.text === 'string') {
    const count = parseTrackCount(value.text)
    if (count) return count
  }
  if (typeof value.content === 'string') {
    const count = parseTrackCount(value.content)
    if (count) return count
  }
  for (const child of Object.values(value)) {
    const count = findPlaylistCount(child)
    if (count) return count
  }
  return 0
}

function parseYouTubePlaylistSearch(html) {
  const initialData = extractJsonObject(cleanText(html), 'var ytInitialData = ')
    || extractJsonObject(cleanText(html), 'ytInitialData = ')
  if (!initialData) return []

  const playlists = []
  function walk(value) {
    if (!value || typeof value !== 'object') return
    const item = value.lockupViewModel
    if (item?.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' && item.contentId) {
      const metadata = item.metadata?.lockupMetadataViewModel
      const metadataParts = metadata?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || []
      const images = item.contentImage?.collectionThumbnailViewModel?.primaryThumbnail
        ?.thumbnailViewModel?.image?.sources || []
      const artwork = [...images].sort((left, right) => Number(right.width || 0) - Number(left.width || 0))[0]
      playlists.push({
        type: 'playlist',
        title: cleanText(metadata?.title?.content, 'Playlist'),
        author: cleanText(metadataParts[0]?.text?.content, 'YouTube'),
        length: 0,
        uri: `https://www.youtube.com/playlist?list=${item.contentId}`,
        artworkUrl: cleanText(artwork?.url) || null,
        sourceName: 'youtube',
        totalTracks: findPlaylistCount(item.contentImage),
        releaseDate: null,
        description: null,
        publisher: 'YouTube',
        playable: true,
      })
    }
    for (const child of Object.values(value)) walk(child)
  }
  walk(initialData)
  return uniqueBy(playlists, collectionKey)
}

function normalizeSpotifyTrack(item) {
  return {
    type: 'track',
    title: cleanText(item?.name, 'Sin titulo'),
    author: cleanText(item?.artists?.map(artist => artist.name).join(', '), 'Artista desconocido'),
    length: Number(item?.duration_ms || 0),
    uri: cleanText(item?.external_urls?.spotify || item?.uri),
    artworkUrl: item?.album?.images?.[0]?.url || null,
    sourceName: 'spotify',
    albumName: cleanText(item?.album?.name) || null,
    releaseDate: cleanText(item?.album?.release_date) || null,
    isrc: cleanText(item?.external_ids?.isrc) || null,
    identifier: cleanText(item?.id) || null,
    isStream: false,
    isSeekable: true,
    explicit: Boolean(item?.explicit),
    popularity: Number(item?.popularity || 0),
    playable: Boolean(item?.external_urls?.spotify || item?.uri),
  }
}

function normalizeSpotifyCollection(item, type) {
  const owner = type === 'album'
    ? item?.artists?.map(artist => artist.name).join(', ')
    : item?.owner?.display_name
  return {
    type,
    title: cleanText(item?.name, type === 'album' ? 'Album' : 'Playlist'),
    author: cleanText(owner, 'Varios artistas'),
    length: 0,
    uri: cleanText(item?.external_urls?.spotify || item?.uri),
    artworkUrl: item?.images?.[0]?.url || null,
    sourceName: 'spotify',
    totalTracks: Number(item?.total_tracks || item?.tracks?.total || item?.items?.total || 0),
    releaseDate: cleanText(item?.release_date) || null,
    description: cleanText(item?.description) || null,
    publisher: cleanText(item?.label || item?.owner?.display_name) || null,
    playable: Boolean(item?.external_urls?.spotify || item?.uri),
  }
}

function normalizeLeoCollection(item, type) {
  const uri = `https://open.spotify.com/${type}/${item.id}`
  return {
    type,
    title: cleanText(item.name, type === 'album' ? 'Album' : 'Playlist'),
    author: cleanText(item.author, 'Varios artistas'),
    length: 0,
    uri,
    artworkUrl: item.artwork || null,
    sourceName: 'spotify',
    totalTracks: Number(item.total || 0),
    releaseDate: item.releaseDate || null,
    description: cleanText(item.description) || null,
    publisher: cleanText(item.publisher) || null,
    playable: true,
  }
}

function normalizeLeoTrack(item) {
  return {
    type: 'track',
    title: cleanText(item?.title || item?.name, 'Sin titulo'),
    author: cleanText(item?.artists?.join(', ') || item?.author, 'Artista desconocido'),
    length: Number(item?.duration || item?.durationMs || 0),
    uri: item?.id ? `https://open.spotify.com/track/${item.id}` : cleanText(item?.uri),
    artworkUrl: cleanText(item?.artwork) || null,
    sourceName: 'spotify',
    albumName: cleanText(item?.albumName || item?.album) || null,
    releaseDate: cleanText(item?.releaseDate) || null,
    isrc: cleanText(item?.isrc) || null,
    identifier: cleanText(item?.id) || null,
    isStream: false,
    isSeekable: true,
    playable: Boolean(item?.id || item?.uri),
  }
}

function appleArtwork(url) {
  return cleanText(url).replace(/100x100bb/i, '600x600bb') || null
}

function normalizeAppleTrack(item) {
  return {
    type: 'track',
    title: cleanText(item?.trackName, 'Sin titulo'),
    author: cleanText(item?.artistName, 'Artista desconocido'),
    length: Number(item?.trackTimeMillis || 0),
    uri: cleanText(item?.trackViewUrl),
    artworkUrl: appleArtwork(item?.artworkUrl100),
    sourceName: 'applemusic',
    albumName: cleanText(item?.collectionName) || null,
    releaseDate: cleanText(item?.releaseDate) || null,
    isrc: cleanText(item?.isrc) || null,
    identifier: cleanText(item?.trackId) || null,
    genre: cleanText(item?.primaryGenreName) || null,
    trackNumber: Number(item?.trackNumber || 0),
    discNumber: Number(item?.discNumber || 0),
    isStream: false,
    isSeekable: true,
    explicit: String(item?.trackExplicitness || '').toLowerCase() === 'explicit',
    playable: Boolean(item?.trackViewUrl),
  }
}

function normalizeAppleAlbum(item) {
  const collection = {
    type: 'album',
    title: cleanText(item?.collectionName, 'Album'),
    author: cleanText(item?.artistName, 'Varios artistas'),
    length: 0,
    uri: cleanText(item?.collectionViewUrl),
    artworkUrl: appleArtwork(item?.artworkUrl100),
    sourceName: 'applemusic',
    totalTracks: Number(item?.trackCount || 0),
    releaseDate: cleanText(item?.releaseDate) || null,
    description: null,
    publisher: cleanText(item?.copyright) || null,
    genre: cleanText(item?.primaryGenreName) || null,
    playable: Boolean(item?.collectionViewUrl),
  }
  if (collection.playable) collection.playUri = encodeCollectionPlayUri(collection)
  return collection
}

function createMusicCatalog(client, options = {}) {
  const http = options.http || axios
  let spotifyToken = null
  let spotifyTokenExpiresAt = 0
  let capabilityCache = null
  let capabilityExpiresAt = 0
  let lavaSearchAvailable = null

  function getNode() {
    return client.shoukaku?.options?.nodeResolver(client.shoukaku.nodes) || null
  }

  function hasSpotifyCredentials() {
    return Boolean(
      (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
      || (client.config?.spotify?.clientID && client.config?.spotify?.clientSecret)
    )
  }

  function hasPulseLinkSpotify() {
    return capabilityCache?.sources?.includes('spotify') ?? false
  }

  function sourceIsConfigured(sourceName) {
    if (sourceName === 'spotify') return hasSpotifyCredentials() || hasPulseLinkSpotify()
    return true
  }

  async function getCapabilities() {
    if (capabilityCache && Date.now() < capabilityExpiresAt) return capabilityCache
    const node = getNode()
    if (!node) return { sources: [], plugins: [], advancedSearch: false }

    try {
      const info = await node.rest.getLavalinkInfo()
      const sources = Array.isArray(info?.sourceManagers)
        ? info.sourceManagers.map(source => String(source).toLowerCase())
        : []
      const plugins = Array.isArray(info?.plugins)
        ? info.plugins.map(plugin => String(plugin?.name || '').toLowerCase())
        : []
      const advancedSearch = plugins.some(name => name.includes('lavasearch'))
      if (advancedSearch) lavaSearchAvailable = true
      capabilityCache = { sources, plugins, advancedSearch }
    } catch {
      capabilityCache = { sources: [], plugins: [], advancedSearch: lavaSearchAvailable === true }
    }
    capabilityExpiresAt = Date.now() + 60_000
    return capabilityCache
  }

  function requestedSources(source, capabilities) {
    if (source && source !== 'all' && SOURCE_DEFINITIONS[source]) {
      return sourceIsConfigured(source) ? [source] : []
    }
    if (!capabilities.sources.length) return ['spotify']

    const aliases = new Set(capabilities.sources.flatMap(name => {
      if (name === 'youtube') return ['youtube', 'ytmusic']
      if (name === 'applemusic' || name === 'apple music') return ['applemusic']
      return [name]
    }))
    return DEFAULT_SOURCE_ORDER.filter(name => aliases.has(name) && sourceIsConfigured(name))
  }

  async function searchLavaSearch(node, query, sourceNames, types = 'track,album,playlist') {
    if (lavaSearchAvailable === false || !sourceNames.length) return { tracks: [], albums: [], playlists: [] }

    const settled = await Promise.allSettled(sourceNames.map(async sourceName => {
      const prefix = SOURCE_DEFINITIONS[sourceName]?.prefix
      if (!prefix) return { tracks: [], albums: [], playlists: [] }
      const payload = await node.rest.fetch({
        endpoint: '/loadsearch',
        options: { params: { query: `${prefix}:${query}`, types } },
      })
      lavaSearchAvailable = true
      return normalizeLavaSearchResponse(payload, sourceName)
    }))

    const merged = { tracks: [], albums: [], playlists: [] }
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        merged.tracks.push(...result.value.tracks)
        merged.albums.push(...result.value.albums)
        merged.playlists.push(...result.value.playlists)
      } else if (result.reason?.status === 404) {
        lavaSearchAvailable = false
      }
    }
    return merged
  }

  async function searchTrackSources(node, query, sourceNames) {
    const settled = await Promise.allSettled(sourceNames.map(async sourceName => {
      const prefix = SOURCE_DEFINITIONS[sourceName]?.prefix
      if (!prefix) return []
      const result = await node.rest.resolve(`${prefix}:${query}`)
      if (!result?.data || ['error', 'empty'].includes(result.loadType)) return []
      const rawTracks = result.loadType === 'track'
        ? [result.data]
        : result.loadType === 'playlist'
          ? result.data?.tracks || []
          : Array.isArray(result.data) ? result.data : []
      return rawTracks.map(track => normalizeTrack(track, sourceName))
    }))
    return settled.flatMap(result => result.status === 'fulfilled' ? result.value : [])
  }

  async function getSpotifyToken() {
    if (spotifyToken && Date.now() < spotifyTokenExpiresAt) return spotifyToken

    const clientId = process.env.SPOTIFY_CLIENT_ID || client.config?.spotify?.clientID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || client.config?.spotify?.clientSecret

    if (clientId && clientSecret) {
      const body = new URLSearchParams({ grant_type: 'client_credentials' })
      const response = await http.post('https://accounts.spotify.com/api/token', body.toString(), {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 8_000,
      })
      spotifyToken = response.data?.access_token || null
      spotifyTokenExpiresAt = Date.now() + Math.max(60, Number(response.data?.expires_in || 3600) - 60) * 1000
      return spotifyToken
    }

    // Fallback: anonymous token from LEO token service (140.245.242.153:8082)
    try {
      const LEO_TOKEN_URL = 'http://140.245.242.153:8082/api/token'
      const res = await http.get(LEO_TOKEN_URL, { timeout: 5_000 })
      const token   = res.data?.access?.accessToken || null
      const expiresAt = Number(res.data?.access?.accessTokenExpirationTimestampMs || 0)
      if (token && expiresAt > Date.now() + 60_000) {
        spotifyToken = token
        spotifyTokenExpiresAt = expiresAt - 60_000
        return spotifyToken
      }
    } catch {}

    return null
  }

  async function searchSpotify(query, limit) {
    try {
      const token = await getSpotifyToken()
      if (!token) return { tracks: [], albums: [], playlists: [] }
      const response = await http.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: 'track,album,playlist',
          limit: Math.min(20, Math.max(1, limit)),
          market: process.env.SPOTIFY_MARKET || 'US',
        },
        timeout: 8_000,
      })
      const data = response.data || {}
      return {
        tracks: (data.tracks?.items || []).filter(Boolean).map(normalizeSpotifyTrack),
        albums: (data.albums?.items || []).filter(Boolean).map(item => normalizeSpotifyCollection(item, 'album')),
        playlists: (data.playlists?.items || []).filter(Boolean).map(item => normalizeSpotifyCollection(item, 'playlist')),
      }
    } catch {
      return { tracks: [], albums: [], playlists: [] }
    }
  }

  async function searchApple(query, limit, kind = 'all') {
    try {
      const baseOptions = {
        params: {
          term: query,
          country: process.env.APPLE_MUSIC_COUNTRY || 'US',
          media: 'music',
          limit: Math.min(20, Math.max(1, limit)),
        },
        timeout: 8_000,
      }
      const needsTracks = !['albums', 'playlists'].includes(kind)
      const needsAlbums = !['tracks', 'playlists'].includes(kind)
      const [trackResponse, albumResponse] = await Promise.all([
        needsTracks ? http.get('https://itunes.apple.com/search', {
          ...baseOptions,
          params: { ...baseOptions.params, entity: 'musicTrack' },
        }) : Promise.resolve({ data: { results: [] } }),
        needsAlbums ? http.get('https://itunes.apple.com/search', {
          ...baseOptions,
          params: { ...baseOptions.params, entity: 'album' },
        }) : Promise.resolve({ data: { results: [] } }),
      ])
      return {
        tracks: (trackResponse.data?.results || []).map(normalizeAppleTrack).filter(item => item.playable),
        albums: (albumResponse.data?.results || []).map(normalizeAppleAlbum).filter(item => item.playable),
        playlists: [],
      }
    } catch {
      return { tracks: [], albums: [], playlists: [] }
    }
  }

  async function searchYouTubePlaylists(query, limit) {
    try {
      const response = await http.get('https://www.youtube.com/results', {
        params: {
          search_query: query,
          sp: 'EgIQAw%3D%3D',
          hl: process.env.YOUTUBE_LANGUAGE || 'es',
          gl: process.env.YOUTUBE_COUNTRY || 'US',
        },
        headers: {
          'Accept-Language': `${process.env.YOUTUBE_LANGUAGE || 'es'},en;q=0.8`,
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/137 Safari/537.36',
        },
        timeout: 8_000,
      })
      return parseYouTubePlaylistSearch(response.data).slice(0, limit)
    } catch {
      return []
    }
  }

  async function enrichWithArtwork(collection) {
    const cacheKey = collection.uri
    const cached = collectionResolveCache.get(cacheKey)
    if (cached) {
      collection.artworkUrl = cached.artwork || collection.artworkUrl
      collection.totalTracks = Number(cached.total || collection.totalTracks || 0)
      return collection
    }
    try {
      const res = await http.get(`${LEO_API_BASE}/api/resolve`, {
        params: { url: cacheKey },
        timeout: 4_000,
      })
      if (res.data && typeof res.data === 'object') {
        collectionResolveCache.set(cacheKey, res.data)
        collection.artworkUrl = res.data.artwork || collection.artworkUrl
        collection.totalTracks = Number(res.data.total || collection.totalTracks || 0)
      }
    } catch {}
    return collection
  }

  async function searchLeoAlbums(query, limit) {
    try {
      const response = await http.get(`${LEO_API_BASE}/api/search/albums`, {
        params: { q: query, limit: Math.min(20, Math.max(1, limit || 5)) },
        timeout: 8_000,
      })
      const items = Array.isArray(response.data) ? response.data : []
      const albums = items.slice(0, limit).map(item => normalizeLeoCollection(item, 'album'))
      const enriched = await Promise.allSettled(albums.map(a => enrichWithArtwork(a)))
      return enriched.map(r => r.status === 'fulfilled' ? r.value : r.reason).filter(Boolean)
    } catch {
      return []
    }
  }

  async function searchLeoTracks(query, limit) {
    try {
      const response = await http.get(`${LEO_API_BASE}/api/search`, {
        params: { q: query, limit: Math.min(30, Math.max(20, limit || 20)) },
        timeout: 10_000,
      })
      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data) ? response.data : []
      return items.map(normalizeLeoTrack).filter(item => item.playable)
    } catch {
      return []
    }
  }

  async function searchLeoPlaylists(query, limit) {
    try {
      const response = await http.get(`${LEO_API_BASE}/api/search/playlists`, {
        params: { q: query, limit: Math.min(20, Math.max(1, limit || 5)) },
        timeout: 8_000,
      })
      const items = Array.isArray(response.data) ? response.data : []
      const playlists = items.slice(0, limit).map(item => normalizeLeoCollection(item, 'playlist'))
      const enriched = await Promise.allSettled(playlists.map(p => enrichWithArtwork(p)))
      return enriched.map(r => r.status === 'fulfilled' ? r.value : r.reason).filter(Boolean)
    } catch {
      return []
    }
  }

  async function searchDirectUrl(node, query) {
    const result = await node.rest.resolve(query)
    if (!result?.data || ['error', 'empty'].includes(result.loadType)) {
      return { tracks: [], albums: [], playlists: [] }
    }
    if (result.loadType === 'playlist') {
      const info = result.data?.info || {}
      const pluginInfo = result.data?.pluginInfo || {}
      const collectionType = /album/i.test(info.name || pluginInfo.type || '') ? 'album' : 'playlist'
      const collection = normalizeCollection({
        info: { ...info, uri: query, totalTracks: result.data?.tracks?.length },
        pluginInfo,
      }, collectionType)
      return {
        tracks: [],
        albums: collectionType === 'album' ? [collection] : [],
        playlists: collectionType === 'playlist' ? [collection] : [],
      }
    }
    const rawTracks = result.loadType === 'track' ? [result.data] : Array.isArray(result.data) ? result.data : []
    return { tracks: rawTracks.map(normalizeTrack), albums: [], playlists: [] }
  }

  async function resolveCollection(identifier) {
    const uri = cleanText(identifier)
    if (!uri) return null
    try {
      let data = collectionResolveCache.get(uri)
      if (!data) {
        const response = await http.get(`${LEO_API_BASE}/api/resolve`, {
          params: { url: uri },
          timeout: 12_000,
        })
        data = response.data
        if (data && typeof data === 'object') collectionResolveCache.set(uri, data)
      }
      const tracks = Array.isArray(data?.items)
        ? data.items.map(normalizeLeoTrack).filter(item => item.playable)
        : []
      if (!tracks.length) return null
      return {
        type: cleanText(data.type, 'playlist'),
        title: cleanText(data.name, 'Colección'),
        author: cleanText(data.author, 'Varios artistas'),
        artworkUrl: cleanText(data.artwork) || null,
        totalTracks: Number(data.total || tracks.length),
        tracks,
      }
    } catch {
      return null
    }
  }

  async function search(query, options = {}) {
    const cleanQuery = cleanText(query)
    const limit = Math.min(20, Math.max(1, Number(options.limit || 8)))
    if (!cleanQuery) return { tracks: [], albums: [], playlists: [], sources: [], advancedSearch: false }

    const node = getNode()
    if (!node) throw new Error('No hay nodos Lavalink disponibles.')
    if (/^https?:\/\//i.test(cleanQuery)) {
      const direct = await searchDirectUrl(node, cleanQuery)
      return { ...direct, sources: ['url'], advancedSearch: lavaSearchAvailable === true }
    }

    const capabilities = await getCapabilities()
    const sources = requestedSources(options.source || 'all', capabilities)
    const kind = cleanText(options.kind || 'all').toLowerCase()
    const needsTracks = !['albums', 'playlists'].includes(kind)
    const needsAlbums = !['tracks', 'playlists'].includes(kind)
    const needsPlaylists = !['tracks', 'albums'].includes(kind)
    const advancedTypes = [
      needsTracks ? 'track' : null,
      needsAlbums ? 'album' : null,
      needsPlaylists ? 'playlist' : null,
    ].filter(Boolean).join(',') || 'track,album,playlist'
    const advancedSources = ADVANCED_SOURCE_ORDER.filter(source => {
      if (!sources.includes(source)) return false
      if (source === 'applemusic' && !process.env.APPLE_MEDIA_TOKEN) return false
      return true
    })
    const fallbackSources = sources.filter(source => source !== 'spotify')
    const [advanced, fallbackTracks, spotify, leoTracks, leoAlbums, leoPlaylists, apple, youtubePlaylists] = await Promise.all([
      searchLavaSearch(node, cleanQuery, advancedSources, advancedTypes),
      needsTracks ? searchTrackSources(node, cleanQuery, fallbackSources) : [],
      sources.includes('spotify') ? searchSpotify(cleanQuery, limit) : { tracks: [], albums: [], playlists: [] },
      needsTracks && sources.includes('spotify') ? searchLeoTracks(cleanQuery, limit) : [],
      needsAlbums && sources.includes('spotify') ? searchLeoAlbums(cleanQuery, limit) : [],
      needsPlaylists && sources.includes('spotify') ? searchLeoPlaylists(cleanQuery, limit) : [],
      sources.includes('applemusic') ? searchApple(cleanQuery, limit, kind) : { tracks: [], albums: [], playlists: [] },
      needsPlaylists && sources.some(source => source === 'youtube' || source === 'ytmusic')
        ? searchYouTubePlaylists(cleanQuery, limit)
        : [],
    ])

    return {
      tracks: needsTracks
        ? rankResults([...spotify.tracks, ...leoTracks, ...advanced.tracks, ...apple.tracks, ...fallbackTracks], cleanQuery, trackKey).slice(0, limit)
        : [],
      albums: needsAlbums
        ? rankResults([...spotify.albums, ...leoAlbums, ...advanced.albums, ...apple.albums], cleanQuery, collectionKey).filter(item => item.playable).slice(0, limit)
        : [],
      playlists: needsPlaylists
        ? rankResults([...spotify.playlists, ...leoPlaylists, ...advanced.playlists, ...youtubePlaylists], cleanQuery, collectionKey).filter(item => item.playable).slice(0, limit)
        : [],
      sources,
      advancedSearch: lavaSearchAvailable === true || capabilities.advancedSearch,
    }
  }

  return { search, resolveCollection, getCapabilities }
}

module.exports = {
  SOURCE_DEFINITIONS,
  createMusicCatalog,
  normalizeAppleAlbum,
  normalizeAppleTrack,
  normalizeCollection,
  normalizeLavaSearchResponse,
  normalizeLeoTrack,
  normalizeSpotifyCollection,
  normalizeSpotifyTrack,
  normalizeTrack,
  parseYouTubePlaylistSearch,
  parseCollectionPlayUri,
  rankResults,
}
