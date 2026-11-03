const { resolveWithTimeout } = require('./resolve-timeout')
const { tracksFromResolve } = require('./utils')
const { assertMusicQuery, allowedMusicTrack } = require('./nodes-config')
const { rankMusicTracks, sameRecording } = require('./recordings')
async function searchNodes(client, raw, requester, { guildId, signal, multiple = false } = {}) {
  const query = assertMusicQuery(raw)
  const nodes = client.nodePool?.candidates(guildId) || [client.music?.getNode?.(guildId)].filter(Boolean)
  if (!nodes.length) throw new Error('No hay conexiones de música disponibles.')
  const name = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown'
  const url = /^https?:\/\//i.test(query)
  if (multiple && !url) {
    const result = await require('./catalog-search').searchCatalogNodes(client, nodes, query, signal)
    return { ...result, tracks: result.tracks.map(track => ({ ...track, info: { ...track.info,
      requester: name, requesterId: typeof requester === 'object' ? requester.id : null } })) }
  }
  const identifiers = url || /^(?:ytsearch|ytmsearch|spsearch|amsearch):/i.test(query) ? [query] : ['spsearch:' + query, 'ytmsearch:' + query, 'ytsearch:' + query, 'amsearch:' + query]
  let failed = false
  for (const node of nodes) {
    let single = null, nodeFailed = false
    for (const identifier of identifiers) {
      try {
        const response = await resolveWithTimeout(node, identifier, 8000, signal)
        if (response?.loadType === 'error') { failed = true; nodeFailed = true; continue }
        const collection = ['playlist', 'album'].includes(response?.loadType)
        const resolved = tracksFromResolve(response).filter(allowedMusicTrack)
        const tracks = (url || collection ? resolved : rankMusicTracks(resolved, query)).map(track => ({ ...track, _resolvedNode: node.name,
          info: { ...track.info, requester: name, requesterId: typeof requester === 'object' ? requester.id : track.info?.requesterId || null } }))
        if (!tracks.length) continue
        if (response.loadType === 'track' && !url) { single = { loadType: response.loadType, tracks, playlistName: null }; continue }
        if (guildId && !client.nyxlink?.players.has(guildId)) client.nodePool?.pin(guildId, node.name)
        const combined = single && !collection ? [...tracks, single.tracks[0]] : tracks
        return { loadType: response.loadType === 'album' ? 'playlist' : response.loadType, tracks: url || ['playlist', 'album'].includes(response.loadType) ? combined : rankMusicTracks(combined, query), playlistName: response.data?.info?.name || null }
      } catch (error) { if (signal?.aborted) throw error; failed = true; nodeFailed = true }
    }
    if (single) {
      if (guildId && !client.nyxlink?.players.has(guildId)) client.nodePool?.pin(guildId, node.name)
      return single
    }
    if (nodeFailed) client.nodePool?.fail(node.name)
  }
  if (failed) throw new Error('No se pudo consultar la música. Reintenta en unos minutos.')
  return null
}
async function trackOnNode(track, node) {
  if (!allowedMusicTrack(track)) throw new Error('source_not_allowed')
  if (track._resolvedNode === node.name) return track
  const info = track.info || track
  if (!info.uri) {
    if (track._resolvedNode && track._resolvedNode !== node.name) throw new Error('track_unavailable')
    return track
  }
  const result = await node.rest.resolve(assertMusicQuery(info.uri))
  const fresh = tracksFromResolve(result).find(value => value.encoded && allowedMusicTrack(value) && sameRecording(track, value))
  if (!fresh) throw new Error('track_unavailable')
  return { ...fresh, _resolvedNode: node.name, info: { ...fresh.info, requester: info.requester, requesterId: info.requesterId } }
}
module.exports = { searchNodes, trackOnNode }
