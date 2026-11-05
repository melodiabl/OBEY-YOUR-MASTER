const { resolveWithTimeout } = require('./resolve-timeout')
const { tracksFromResolve } = require('./utils')
const { assertMusicQuery, allowedMusicTrack } = require('./nodes-config')
const { sameRecording } = require('./recordings')
async function searchNodes(client, raw, requester, { guildId, signal, kind = 'tracks', source = 'auto' } = {}) {
  const query = assertMusicQuery(raw)
  const nodes = client.nodePool?.candidates(guildId) || [client.music?.getNode?.(guildId)].filter(Boolean)
  if (!nodes.length) throw new Error('No hay conexiones de música disponibles.')
  const name = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown'
  const url = /^https?:\/\//i.test(query)
  if (!url) {
    const result = await require("../../bot/modulos/musica/datos/catalogo").searchCatalogNodes(client, nodes, query, signal, { kind, source })
    return { ...result, tracks: result.tracks.map(track => ({ ...track, info: { ...track.info,
      requester: name, requesterId: typeof requester === 'object' ? requester.id : null } })) }
  }
  let failed = false
  for (const node of nodes) {
    try {
      const response = await resolveWithTimeout(node, query, 8000, signal)
      if (response?.loadType === 'error') { failed = true; continue }
      const tracks = tracksFromResolve(response).filter(allowedMusicTrack).map(track => ({ ...track, _resolvedNode: node.name,
        info: { ...track.info, requester: name, requesterId: typeof requester === 'object' ? requester.id : track.info?.requesterId || null } }))
      if (!tracks.length) continue
      return { loadType: ['playlist', 'album'].includes(response.loadType) ? 'playlist' : response.loadType,
        tracks, playlistName: response.data?.info?.name || null }
    } catch (error) { if (signal?.aborted) throw error; failed = true }
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
