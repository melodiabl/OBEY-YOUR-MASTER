// Shim de compatibilidad: los comandos prefix (play/search) siguen llamando
// searchDiscordCatalog/enqueueCatalogItem, pero ahora todo resuelve vía
// client.music.search (catálogo de los nodos públicos configurados).
const { sameRecording, rankMusicTracks, preferredCatalogTab } = require('./music/recordings')

const CATALOG_LIMIT = 20

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

async function searchDiscordCatalog(client, query, context = {}) {
  const result = await client.music.search(query, 'Búsqueda', { ...context, multiple: true })
  const limit = Math.max(1, Math.min(50, Number(context.limit) || CATALOG_LIMIT))
  const tracks = (result?.tracks || []).slice(0, limit)
  const albums = rankMusicTracks(result?.albums || [], query).slice(0, 20)

  const catalog = { tracks, albums, artists: result?.artists || [], playlists: [], statuses: result?.statuses || {}, sources: result?.sources || {}, query: result?.query || query.replace(/^(?:spsearch|amsearch|ytsearch|ytmsearch):/i, ''), source: result?.source || context.source || 'auto', kind: result?.kind || context.kind || 'all' }
  return { ...catalog, preferredTab: preferredCatalogTab(catalog, query) }
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
