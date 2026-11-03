const { resolveWithTimeout } = require('./resolve-timeout')
const { tracksFromResolve } = require('./utils')
const { assertMusicQuery, allowedMusicTrack } = require('./nodes-config')
const { sameRecording, rankMusicTracks, hasUnrequestedVersion } = require('./recordings')

function youtubeId(track) {
  try {
    const url = new URL((track.info || track).uri)
    if (!/^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)$/i.test(url.hostname)) return null
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v')
    return /^[\w-]{11}$/.test(id || '') ? id : null
  } catch { return null }
}

async function recommendTracks(client, seed, requester, { guildId, signal } = {}) {
  if (signal?.aborted) throw new Error('Music lookup cancelled')
  if (!seed || !allowedMusicTrack(seed)) return null
  const info = seed.info || seed
  const query = `${info.title || ''} ${info.author || ''}`.trim()
  if (!query) return null
  const nodes = client.nodePool?.candidates(guildId) || [client.music?.getNode?.(guildId)].filter(Boolean)
  for (const node of nodes.slice(0, 2)) {
    try {
      let id = youtubeId(seed)
      if (!id) {
        const response = await resolveWithTimeout(node, assertMusicQuery('ytmsearch:' + query), 4000, signal)
        const recording = rankMusicTracks(tracksFromResolve(response).filter(allowedMusicTrack), query)
          .find(track => sameRecording(seed, track) && youtubeId(track))
        id = recording && youtubeId(recording)
      }
      if (!id) continue
      const mix = await resolveWithTimeout(node, `https://www.youtube.com/watch?v=${id}&list=RD${id}`, 4000, signal)
      const tracks = []
      for (const track of tracksFromResolve(mix)) {
        if (!track.encoded || !allowedMusicTrack(track) || hasUnrequestedVersion(track, query) || sameRecording(seed, track) ||
          tracks.some(existing => existing.info?.uri === track.info?.uri || sameRecording(existing, track))) continue
        tracks.push({ ...track, _resolvedNode: node.name, info: { ...track.info,
          requester: typeof requester === 'string' ? requester : requester?.username || 'Recomendaciones',
          requesterId: typeof requester === 'object' ? requester?.id || null : info.requesterId || null } })
        if (tracks.length >= 20) break
      }
      if (tracks.length) return { loadType: 'search', tracks, playlistName: null }
    } catch (error) { if (signal?.aborted) throw error }
  }
  return null
}

module.exports = { recommendTracks }
