// Shim de compatibilidad: los comandos prefix (play/search) siguen llamando
// searchDiscordCatalog/enqueueCatalogItem, pero ahora todo resuelve vía
// client.music.search (Lavalink: spsearch→ytmsearch→ytsearch) y LEO solo para álbumes.
const http = require('http')

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
    http.get(`${LEO}${path}`, { timeout: 6000 }, r => {
      let d = ''
      r.on('data', c => d += c)
      r.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(null) } })
    }).on('error', () => resolve(null)).on('timeout', () => resolve(null))
  })
}

async function searchDiscordCatalog(client, query) {
  const [result, albumsRaw] = await Promise.all([
    client.music.search(query, 'Búsqueda').catch(() => null),
    leoGet(`/api/search/albums?q=${encodeURIComponent(query)}&limit=10`),
  ])

  const tracks = (result?.tracks || []).slice(0, CATALOG_LIMIT)

  // LEO /search/albums devuelve también "singles" (1 pista) sin distinguir.
  // Resolvemos cada uno en paralelo para saber su nº de pistas + carátula,
  // y descartamos los de 1 sola pista (esos son tracks, no álbumes reales).
  const albumsBasic = (Array.isArray(albumsRaw) ? albumsRaw : []).slice(0, 8)
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
  const albums = albumsResolved.filter(a => a.totalTracks >= 2)

  return { tracks, albums, playlists: [] }
}

async function enqueueCatalogItem(client, message, voiceChannel, item) {
  const info   = itemInfo(item)
  const player = await client.music.joinChannel(message.guild.id, voiceChannel.id, message.channel.id)
  const state  = client.music.getState(message.guild.id)
  let tracks

  if (info.type === 'album' || info.type === 'playlist') {
    const identifier = info.playUri || info.uri
    const result = identifier
      ? await client.music.search(identifier, message.author).catch(() => null)
      : null
    tracks = result?.tracks || []
    if (!tracks.length) throw new Error('No se pudieron cargar las pistas de esta colección.')
  } else if (item?.encoded) {
    // Track real de Lavalink — encolar tal cual
    if (item.info) item.info.requester = message.author?.username || 'Unknown'
    tracks = [item]
  } else {
    // Item plano sin encoded — resolver por URI o por título
    const q = info.uri || `${info.title || ''} ${info.author || ''}`.trim()
    const result = await client.music.search(q, message.author).catch(() => null)
    const first  = result?.tracks?.find(t => t.encoded)
    if (!first) throw new Error('No se pudo resolver esta pista.')
    tracks = [first]
  }

  const wasIdle = !state.currentTrack
  for (const track of tracks) state.queue.push(track)
  if (wasIdle) await client.music._playNext(message.guild.id, player)

  return { added: tracks.length, isNow: wasIdle, state }
}

module.exports = { searchDiscordCatalog, enqueueCatalogItem, itemInfo, toQueueTrack }
