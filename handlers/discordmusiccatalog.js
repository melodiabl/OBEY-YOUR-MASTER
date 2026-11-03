// Shim de compatibilidad: los comandos prefix (play/search) siguen llamando
// searchDiscordCatalog/enqueueCatalogItem, pero ahora todo resuelve vía
// client.music.search (catálogo combinado Lavalink) y respaldo legado de álbumes.
const http = require('http')
const { artistsFromTracks, uniqueArtists } = require('./music/artists')
const { sameRecording, rankMusicTracks, recordingArtist, recordingTitle } = require('./music/recordings')

const CATALOG_LIMIT = 20
const LEO = 'http://140.245.242.153:8081'

function itemInfo(item) {
  return item?.info || item || {}
}

// Track "plano" para la cola (sin encoded — _playNext lo resuelve lazy por URI/título)
function toQueueTrack(item, requester) {
  const info = itemInfo(item)
  return {
    info: {
      title: info.title || 'Sin titulo',
      author: info.author || 'Artista desconocido',
      length: Number(info.length || 0),
      uri: info.uri || '',
      artworkUrl: info.artworkUrl || null,
      sourceName: info.sourceName || 'spotify',
      albumName: info.albumName || null,
      releaseDate: info.releaseDate || null,
      isrc: info.isrc || null,
      identifier: info.identifier || null,
      isStream: Boolean(info.isStream),
      isSeekable: info.isSeekable !== false,
      requester: requester?.username || requester?.tag || String(requester || 'Unknown'),
    },
  }
}

function leoGet(path) {
  return new Promise(resolve => {
    const request = http.get(`${LEO}${path}`, { timeout: 1500, signal: AbortSignal.timeout(1500) }, r => {
      if (r.statusCode !== 200) { r.resume(); return resolve(null) }
      let d = ''
      r.on('data', c => { d += c; if (Buffer.byteLength(d) > 1000000) { request.destroy(); resolve(null) } })
      r.on('error', () => resolve(null))
      r.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(null) } })
    }).on('error', () => resolve(null)).on('timeout', () => { request.destroy(); resolve(null) })
  })
}

async function legacyAlbums(query) {
  const albumsRaw = await leoGet(`/api/search/albums?q=${encodeURIComponent(query)}&limit=10`)
  // LEO /search/albums devuelve también "singles" (1 pista) sin distinguir.
  // Resolvemos cada uno en paralelo para saber su nº de pistas + carátula,
  // y descartamos los de 1 sola pista (esos son tracks, no álbumes reales).
  const albumsBasic = (Array.isArray(albumsRaw) ? albumsRaw : []).filter(a => /^[A-Za-z0-9]{22}$/.test(a.id)).slice(0, 8)
  const albumsResolved = await Promise.all(albumsBasic.map(async a => {
    const meta  = await leoGet(`/api/resolve?url=https://open.spotify.com/album/${a.id}`).catch(() => null)
    const total = Number(meta?.total) || (meta?.items?.length || 0)
    return {
      type: 'album',
      title: a.name,
      author: a.author,
      uri: `https://open.spotify.com/album/${a.id}`,
      artworkUrl: meta?.artwork || null,
      sourceName: 'spotify',
      totalTracks: total,
    }
  }))
  return albumsResolved.filter(a => a.totalTracks >= 2)
}

async function searchDiscordCatalog(client, query, context = {}) {
  const [result, legacy] = await Promise.all([
    client.music.search(query, 'Búsqueda', { ...context, multiple: true }),
    legacyAlbums(query),
  ])
  const limit = Math.max(1, Math.min(50, Number(context.limit) || CATALOG_LIMIT))
  const tracks = (result?.tracks || []).slice(0, limit)
  const exact = tracks.filter(track => recordingArtist(itemInfo(track).author) === recordingArtist(query))
  const artistSearch = new Set(exact.map(track => recordingTitle(itemInfo(track)))).size >= 2
  const seen = new Set()
  const albums = [...(result?.albums || []), ...legacy].filter(album => {
    if (seen.has(album.uri) || artistSearch && recordingArtist(album.author) !== recordingArtist(query)) return false
    if (!rankMusicTracks([{ info: { title: album.title, author: album.author } }], query).length) return false
    seen.add(album.uri); return true
  }).slice(0, 20)

  return { tracks, albums, artists: uniqueArtists([...(result?.artists || []), ...artistsFromTracks(tracks, query)]), playlists: [] }
}

async function enqueueCatalogItem(client, message, voiceChannel, item, { authorize } = {}) {
  const info   = itemInfo(item)
  const state  = client.music.getState(message.guild.id)
  const epoch = state.stopRequestEpoch || 0
  let tracks

  if (info.type === 'album' || info.type === 'playlist') {
    const identifier = info.playUri || info.uri
    const result = identifier
      ? await client.music.search(identifier, message.author, { guildId: message.guild.id }).catch(() => null)
      : null
    tracks = result?.tracks || []
    if (!tracks.length) throw new Error('No se pudieron cargar las pistas de esta colección.')
  } else if (item?.encoded) {
    // Track real de Lavalink — encolar tal cual
    tracks = [{ ...item, info: { ...item.info, requester: message.author?.username || 'Unknown', requesterId: message.author?.id } }]
  } else {
    // Item plano sin encoded — resolver por URI o por título
    const q = info.uri || `${info.title || ''} ${info.author || ''}`.trim()
    const result = await client.music.search(q, message.author, { guildId: message.guild.id }).catch(() => null)
    const first  = result?.tracks?.find(t => t.encoded && sameRecording(item, t))
    if (!first) throw new Error('No se pudo resolver esta pista.')
    tracks = [first]
  }

  const current = () => !client._shuttingDown && client.music.getState(message.guild.id) === state && !state.stopRequested && (state.stopRequestEpoch || 0) === epoch
  if (!current()) throw new Error('La solicitud se canceló al detener o vaciar el reproductor.')
  if (authorize) voiceChannel = await authorize()
  if (!current()) throw new Error('La solicitud se canceló al detener o vaciar el reproductor.')
  const wasIdle = !state.currentTrack
  if (typeof client.music.playCollection === 'function') {
    await client.music.playCollection(message.guild.id, voiceChannel.id, message.channel.id, tracks, message.author)
    return { added: tracks.length, isNow: wasIdle, state }
  }
  await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
  if (!current()) throw new Error('La solicitud se canceló al detener o vaciar el reproductor.')
  await client.music.enqueue(message.guild.id, tracks)

  return { added: tracks.length, isNow: wasIdle, state }
}

module.exports = { searchDiscordCatalog, enqueueCatalogItem, itemInfo, toQueueTrack }
