const { artistsFromTracks, normalizeArtist, uniqueArtists, albumsFromTracks } = require('./artists')
const { lookupWithTimeout } = require('./resolve-timeout')
const { tracksFromResolve } = require('./utils')
const { allowedMusicTrack } = require('./nodes-config')
const { rankMusicTracks, recordingArtist } = require('./recordings')

const catalogs = new WeakMap()
const PREFIXES = ['spsearch:', 'ytmsearch:', 'ytsearch:', 'amsearch:']
const cleanQuery = query => query.replace(/^(?:spsearch|ytmsearch|ytsearch|amsearch):/i, '')
const spotifyURL = (value, kind) => typeof value === 'string' &&
  new RegExp('^https://open\\.spotify\\.com/' + kind + '/[A-Za-z0-9]{22}$').test(value)

async function collect(client, nodes, query) {
  const deadline = Date.now() + 6500
  const bounded = (lookup, maximum) => lookupWithTimeout(lookup, Math.max(1, Math.min(maximum, deadline - Date.now())))
  const typed = /^(?:spsearch|ytmsearch|ytsearch|amsearch):/i.test(query)
  const identifiers = typed ? [query] : PREFIXES.map(prefix => prefix + query)
  const phrase = cleanQuery(query), rows = [], successful = []
  let failures = 0
  await Promise.all(nodes.slice(0, 2).map(async node => {
    let errors = 0
    const batches = await Promise.all(identifiers.map(async identifier => {
      try {
        const result = await bounded(() => node.rest.resolve(identifier), 3500)
        if (result?.loadType === 'error') throw new Error('provider_unavailable')
        return tracksFromResolve(result).slice(0, 500).filter(allowedMusicTrack)
          .map(track => ({ ...track, _resolvedNode: node.name }))
      } catch { failures++; errors++; return [] }
    }))
    // A failed query or provider quota says nothing about voice availability.
    // Only the node transport/recovery owner changes the audio pool cooldown.
    if (errors < identifiers.length) successful.push({ node, tracks: batches.flat() })
  }))
  // Stable source/node order matters: completion time must not decide the winner.
  for (const node of nodes.slice(0, 2)) rows.push(...(successful.find(batch => batch.node === node)?.tracks || []))
  const albums = [], artistResults = []
  const metadataNodes = successful.filter(batch => batch.node.rest.fetch).sort((a, b) =>
    Number(b.tracks.some(track => track.info?.sourceName === 'spotify')) - Number(a.tracks.some(track => track.info?.sourceName === 'spotify')))
  if ((!typed || /^spsearch:/i.test(query)) && metadataNodes.length && Date.now() < deadline) {
    try {
      let data
      for (const batch of metadataNodes) {
        if (Date.now() >= deadline) break
        try {
          const found = await bounded(() => batch.node.rest.fetch({ endpoint: '/loadsearch',
            options: { params: { query: 'spsearch:' + phrase, types: 'artist,album' } } }), 1000)
          if (Array.isArray(found?.albums) || Array.isArray(found?.artists)) { data = found; break }
        } catch { /* Another node may provide the optional plugin. */ }
      }
      data ||= {}
      artistResults.push(...(data.artists || []).map(normalizeArtist).filter(artist => artist && recordingArtist(artist.title).includes(recordingArtist(phrase))))
      const candidates = (data?.albums || []).slice(0, 20).filter(item => {
        const info = { title: item.info?.name, author: item.pluginInfo?.author }
        return spotifyURL(item.pluginInfo?.url, 'album') && rankMusicTracks([{ info }], phrase).length > 0
      })
      for (const item of candidates) {
        const total = item.pluginInfo.totalTracks
        if (Number(total) < 2 || !Number.isFinite(Number(total))) continue
        albums.push({ type: 'album', title: item.info?.name || phrase, author: item.pluginInfo.author,
          uri: item.pluginInfo.url, artworkUrl: item.pluginInfo.artworkUrl || null, sourceName: 'spotify', totalTracks: Number(total) })
      }
    } catch { /* LavaSearch is optional; missing plugins retain basic search. */ }
  }
  const tracks = rankMusicTracks(rows, phrase).slice(0, 50)
  const rankedAlbums = rankMusicTracks([...albums, ...albumsFromTracks(rows).filter(a => a.title)], phrase).slice(0, 20)
  if (!tracks.length && !albums.length && failures && !successful.length) throw new Error('No se pudo consultar la música. Reintenta en unos minutos.')
  return { loadType: 'search', tracks, albums: rankedAlbums, artists: uniqueArtists([...artistResults, ...artistsFromTracks(rows, phrase)]), playlistName: null }
}

async function searchCatalogNodes(client, nodes, query, signal) {
  if (signal?.aborted) throw new Error('Music lookup cancelled')
  // Catalog plugins are useful even when audio is routed to another backend.
  const score = node => Number(Boolean(client.nodePool?.supportsPlugin?.(node.name, 'lavasrc'))) * 2 + Number(Boolean(client.nodePool?.supportsPlugin?.(node.name, 'lavasearch')))
  nodes = nodes.slice().sort((a, b) => score(b) - score(a))
  let state = catalogs.get(client)
  if (!state) { state = { entries: new Map(), active: 0 }; catalogs.set(client, state) }
  const key = JSON.stringify([nodes.slice(0, 2).map(node => node.name), query])
  let entry = state.entries.get(key)
  if (entry && entry.expires <= Date.now()) { state.entries.delete(key); entry = null }
  if (!entry) {
    if (state.active >= 4) throw Object.assign(new Error('Hay varias búsquedas en curso. Reintenta en unos segundos.'), { code: 'music_search_busy' })
    if (state.entries.size >= 100) {
      for (const [name, cached] of state.entries) if (cached.expires !== Infinity) { state.entries.delete(name); break }
    }
    state.active++
    entry = { expires: Infinity }
    entry.promise = collect(client, nodes, query).then(result => {
      entry.expires = Date.now() + (result.tracks.length ? 20000 : 5000)
      return result
    }, error => { state.entries.delete(key); throw error }).finally(() => state.active--)
    state.entries.set(key, entry)
  }
  // Each caller cancels its own wait. The bounded shared lookup carries no
  // requester/guild data and never enqueues or changes a playback node.
  return lookupWithTimeout(() => entry.promise, 7000, signal)
}

module.exports = { searchCatalogNodes }
