const { normalizeArtist, normalizeAlbum } = require("../../../../handlers/music/artists")
const { lookupWithTimeout } = require("../../../../handlers/music/resolve-timeout")
const { tracksFromResolve } = require("../../../../handlers/music/utils")
const { viewTrack } = require("../../../../handlers/music/tracks")
const { allowedMusicTrack, assertMusicQuery } = require("../../../../handlers/music/nodes-config")
const { rankMusicTracks, recordingArtist } = require("../../../../handlers/music/recordings")

const catalogs = new WeakMap()
const SOURCES = { spotify: 'spsearch', applemusic: 'amsearch', ytmusic: 'ytmsearch', youtube: 'ytsearch' }
const KINDS = ['tracks', 'albums', 'artists']
function searchOptions(query, { kind = 'all', source = 'auto' } = {}) {
  query = assertMusicQuery(query)
  source = source === 'all' ? 'auto' : source
  if (!['all', 'playlists', ...KINDS].includes(kind) || !['auto', ...Object.keys(SOURCES)].includes(source)) throw Object.assign(Error('invalid_search_options'), { code: 'invalid_search_options' })
  const prefix = query.match(/^(spsearch|amsearch|ytmsearch|ytsearch):/i)
  if (prefix) {
    const selected = Object.keys(SOURCES).find(key => SOURCES[key] === prefix[1].toLowerCase())
    if (source !== 'auto' && source !== selected) throw Object.assign(Error('conflicting_search_source'), { code: 'invalid_search_options' })
    source = selected; query = query.slice(prefix[0].length).trim()
    if (!query) throw Object.assign(Error('invalid_query'), { code: 'invalid_search_options' })
  }
  return { query, kind, source }
}
async function collect(client, nodes, options) {
  const deadline = Date.now() + 6500
  const result = { loadType: 'search', tracks: [], albums: [], artists: [], playlists: [], statuses: {}, sources: {}, query: options.query, source: options.source, kind: options.kind, playlistName: null }
  const kinds = options.kind === 'all' ? KINDS : [options.kind]
  await Promise.all(kinds.map(async kind => {
    const supported = kind === 'tracks' ? Object.keys(SOURCES) : kind === 'playlists' ? [] : ['spotify', 'applemusic']
    const sources = options.source === 'auto' ? supported : supported.includes(options.source) ? [options.source] : []
    if (!sources.length) { result.statuses[kind] = 'unsupported'; return }
    let successful = false
    for (const source of sources) {
      if (Date.now() >= deadline) break
      let responded = false
      const round = new AbortController()
      const attempts = nodes.slice(0, 2).map(async node => {
        const timeout = Math.max(1, Math.min(options.source === 'auto' ? 2000 : 3500, deadline - Date.now()))
        const signal = AbortSignal.any([round.signal, AbortSignal.timeout(timeout)])
        try {
          let rows
          if (kind === 'tracks') {
            const platform = source === 'ytmusic' ? 'youtubemusic' : source === 'youtube' ? 'youtube' : SOURCES[source]
            const response = await lookupWithTimeout(() => client.nyxlink.search({ query: options.query, source: platform, node: node.name, signal }), timeout, signal)
            if (response?.loadType === 'error') throw Error('provider_unavailable')
            rows = (response?.tracks || []).map(viewTrack).filter(allowedMusicTrack)
              .filter(track => !track.pluginInfo?.type || track.pluginInfo.type === 'track')
              .map(track => ({ ...track, _resolvedNode: node.name }))
          } else {
            const type = kind === 'artists' ? 'artist' : 'album'
            if (node.native?.isNodeLink) {
              const response = await lookupWithTimeout(() => node.rest.resolve(`${SOURCES[source]}:${type}:${options.query}`, { signal, timeoutMs: timeout }), timeout, signal)
              if (response?.loadType === 'error') throw Error('provider_unavailable')
              rows = tracksFromResolve(response)
            } else {
              if (!node.rest?.fetch) throw Error('metadata_unavailable')
              const response = await lookupWithTimeout(() => node.rest.fetch({ endpoint: '/loadsearch', options: { params: { query: `${SOURCES[source]}:${options.query}`, types: type }, signal } }), timeout, signal)
              if (!Array.isArray(response?.[kind])) throw Error('metadata_unavailable')
              rows = response[kind]
            }
            rows = rows.slice(0, 50).filter(allowedMusicTrack).map(kind === 'artists' ? normalizeArtist : normalizeAlbum).filter(Boolean)
          }
          rows = rows.filter(item => kind === 'tracks'
            ? (item.info?.sourceName === source || source === 'ytmusic' && ['youtube', 'youtubemusic'].includes(item.info?.sourceName) || source === 'youtube' && item.info?.sourceName === 'ytdlp')
            : item.sourceName === source)
          if (kind === 'tracks') rows = rankMusicTracks(rows, options.query).slice(0, 50)
          responded = true
          if (rows.length) return { rows }
        } catch { /* A catalog failure does not change audio-node health. */ }
        throw Error('no_catalog_result')
      })
      const found = await Promise.any(attempts).catch(() => null)
      round.abort()
      successful ||= responded
      if (!found) continue
      if (kind === 'tracks') result.tracks = found.rows
      else {
        const rows = [...new Map(found.rows.map(row => [row.uri, row])).values()]
        if (kind === 'artists') {
          const name = recordingArtist(options.query)
          rows.sort((a, b) => Number(recordingArtist(b.title) === name) - Number(recordingArtist(a.title) === name))
        }
        result[kind] = rows.slice(0, 20)
      }
      if (!result[kind].length) continue
      result.statuses[kind] = 'ready'; result.sources[kind] = source; return
    }
    result.statuses[kind] = successful ? 'empty' : 'unavailable'
  }))
  return result
}
async function searchCatalogNodes(client, nodes, query, signal, context) {
  if (signal?.aborted) throw Error('Music lookup cancelled')
  const options = searchOptions(query, context)
  const score = node => Number(Boolean(client.nodePool?.supportsPlugin?.(node.name, 'lavasrc'))) * 2 + Number(Boolean(node.native?.isNodeLink))
  nodes = nodes.slice().sort((a, b) => score(b) - score(a))
  let state = catalogs.get(client)
  if (!state) { state = { entries: new Map(), active: 0 }; catalogs.set(client, state) }
  const key = JSON.stringify([nodes.slice(0, 2).map(node => [node.name, node.sessionId, node.native?.backend?.kind]), options])
  let entry = state.entries.get(key)
  if (entry && entry.expires <= Date.now()) { state.entries.delete(key); entry = null }
  if (!entry) {
    if (state.active >= 4) throw Object.assign(Error('Hay varias búsquedas en curso.'), { code: 'music_search_busy' })
    if (state.entries.size >= 100) for (const [name, cached] of state.entries) if (cached.expires !== Infinity) { state.entries.delete(name); break }
    state.active++; entry = { expires: Infinity }
    entry.promise = collect(client, nodes, options).then(result => {
      entry.expires = Date.now() + (Object.values(result.statuses).includes('unavailable') ? 1000 : 20000)
      return result
    }, error => { state.entries.delete(key); throw error }).finally(() => state.active--)
    state.entries.set(key, entry)
  }
  return lookupWithTimeout(() => entry.promise, 7000, signal)
}
module.exports = { searchCatalogNodes, searchOptions }
