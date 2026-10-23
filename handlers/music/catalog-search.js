const { lookupWithTimeout } = require('./resolve-timeout')
const { tracksFromResolve } = require('./utils')
const { allowedMusicTrack } = require('./nodes-config')
const { rankMusicTracks, recordingArtist, recordingTitle } = require('./recordings')

const catalogs = new WeakMap()
const PREFIXES = ['spsearch:', 'ytmsearch:', 'ytsearch:', 'amsearch:']
const cleanQuery = query => query.replace(/^(?:spsearch|ytmsearch|ytsearch|amsearch):/i, '')
const creditedArtist = name => String(name || '').normalize('NFC').toLowerCase()
  .replace(/\s+-\s+topic$|vevo$/i, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
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
    if (errors === identifiers.length) client.nodePool?.fail(node.name)
    else successful.push({ node, tracks: batches.flat() })
  }))
  // Stable source/node order matters: completion time must not decide the winner.
  for (const node of nodes.slice(0, 2)) rows.push(...(successful.find(batch => batch.node === node)?.tracks || []))
  const albums = []
  let artistIdentity = null
  const exact = rows.filter(track => recordingArtist(track.info?.author) === recordingArtist(phrase))
  const artistSearch = new Set(exact.map(track => recordingTitle(track.info))).size >= 2
  const metadataNodes = successful.filter(batch => batch.node.rest.fetch).sort((a, b) =>
    Number(b.tracks.some(track => track.info?.sourceName === 'spotify')) - Number(a.tracks.some(track => track.info?.sourceName === 'spotify')))
  if ((!typed || /^spsearch:/i.test(query)) && metadataNodes.length && Date.now() < deadline) {
    try {
      let data, metadataNode
      for (const batch of metadataNodes) {
        if (Date.now() >= deadline) break
        try {
          const found = await bounded(() => batch.node.rest.fetch({ endpoint: '/loadsearch',
            options: { params: { query: 'spsearch:' + phrase, types: 'artist,album' } } }), 1000)
          if (Array.isArray(found?.albums) || Array.isArray(found?.artists)) { data = found; metadataNode = batch; break }
        } catch { /* Another node may provide the optional plugin. */ }
      }
      if (!data) return { loadType: 'search', tracks: rankMusicTracks(rows, phrase).slice(0, 50), albums, playlistName: null }
      const candidates = (data?.albums || []).slice(0, 20).filter(item => {
        const info = { title: item.info?.name, author: item.pluginInfo?.author }
        return spotifyURL(item.pluginInfo?.url, 'album') && (artistSearch
          ? recordingArtist(info.author) === recordingArtist(phrase)
          : rankMusicTracks([{ info }], phrase).length > 0)
      })
      const artists = [...new Map((data?.artists || []).slice(0, 20)
        .filter(item => spotifyURL(item.pluginInfo?.url, 'artist') && recordingArtist(item.pluginInfo.author) === recordingArtist(phrase))
        .map(item => [item.pluginInfo.url, item])).values()]
      // A name shared by several Spotify identities is not an artist selection.
      const enrich = artistSearch && artists.length === 1 ? [artists[0], ...candidates.slice(0, 1)] : []
      if (enrich.length) artistIdentity = artists[0].pluginInfo.author
      const expanded = await Promise.all(enrich.map(async item => {
        try {
          const resolved = await bounded(() => metadataNode.node.rest.resolve(item.pluginInfo.url), 2000)
          const tracks = tracksFromResolve(resolved).slice(0, 500).filter(allowedMusicTrack)
          item.observedTracks = tracks.length
          return tracks.map(track => ({ ...track, _resolvedNode: metadataNode.node.name }))
        } catch { return [] /* Optional expansion preserves valid search results. */ }
      }))
      rows.push(...expanded.flat())
      for (const item of candidates) {
        const total = item.observedTracks ?? item.pluginInfo.totalTracks
        if (Number(total) < 2 || !Number.isFinite(Number(total))) continue
        albums.push({ type: 'album', title: item.info?.name || phrase, author: item.pluginInfo.author,
          uri: item.pluginInfo.url, artworkUrl: item.pluginInfo.artworkUrl || null, sourceName: 'spotify', totalTracks: Number(total) })
      }
    } catch { /* LavaSearch is optional; missing plugins retain basic search. */ }
  }
  // Accent folding finds candidates, but cannot establish that ADÉLA and a
  // homonymous AdELA are the same artist. Anchor uncertain credits to songs
  // observed in the confirmed catalog, instead of importing their discography.
  const knownTitles = new Set(rows.filter(track => /^(?:spotify|applemusic)$/.test(track.info?.sourceName || '') &&
    creditedArtist(track.info.author) === creditedArtist(artistIdentity)).map(track => recordingTitle(track.info)))
  const tracks = rankMusicTracks(rows.filter(track => !artistIdentity || knownTitles.has(recordingTitle(track.info)) ||
    String(track.info?.author || '').split(/\s+(?:feat\.?|ft\.?|with|and|x)\s+|[,/&]/i)
      .some(credit => creditedArtist(credit) === creditedArtist(artistIdentity))), phrase).slice(0, 50)
  if (!tracks.length && !albums.length && failures && !successful.length) throw new Error('No se pudo consultar la música. Reintenta en unos minutos.')
  return { loadType: 'search', tracks, albums, playlistName: null }
}

async function searchCatalogNodes(client, nodes, query, signal) {
  if (signal?.aborted) throw new Error('Music lookup cancelled')
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
