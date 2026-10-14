const { tracksFromResolve } = require('./utils')
const { assertMusicQuery, allowedMusicTrack } = require('./nodes-config')
async function searchNodes(client, raw, requester, { guildId } = {}) {
  const query = assertMusicQuery(raw)
  const nodes = client.nodePool?.candidates(guildId) || [client.shoukaku?.options?.nodeResolver(client.shoukaku.nodes)].filter(Boolean)
  if (!nodes.length) throw new Error('No hay conexiones de música disponibles.')
  const name = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown'
  const url = /^https?:\/\//i.test(query)
  const identifiers = url || /^(?:ytsearch|ytmsearch|spsearch|scsearch|jssearch|amsearch|dzsearch):/i.test(query) ? [query] : ['spsearch:' + query, 'ytsearch:' + query]
  let failed = false
  for (const node of nodes) {
    let single = null, nodeFailed = false
    for (const identifier of identifiers) {
      try {
        const response = await node.rest.resolve(identifier)
        if (response?.loadType === 'error') { failed = true; nodeFailed = true; continue }
        const tracks = tracksFromResolve(response).filter(allowedMusicTrack).map(track => ({ ...track, _resolvedNode: node.name,
          info: { ...track.info, requester: name, requesterId: typeof requester === 'object' ? requester.id : track.info?.requesterId || null } }))
        if (!tracks.length) continue
        if (response.loadType === 'track' && !url) { single = { loadType: response.loadType, tracks, playlistName: null }; continue }
        if (guildId && !client.shoukaku.players.has(guildId)) client.nodePool?.pin(guildId, node.name)
        return { loadType: response.loadType, tracks: single ? [...tracks, single.tracks[0]] : tracks, playlistName: response.data?.info?.name || null }
      } catch { failed = true; nodeFailed = true }
    }
    if (single) {
      if (guildId && !client.shoukaku.players.has(guildId)) client.nodePool?.pin(guildId, node.name)
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
  const fresh = tracksFromResolve(result).find(value => value.encoded && allowedMusicTrack(value))
  if (!fresh) throw new Error('track_unavailable')
  return { ...fresh, _resolvedNode: node.name, info: { ...fresh.info, requester: info.requester, requesterId: info.requesterId } }
}
module.exports = { searchNodes, trackOnNode }
