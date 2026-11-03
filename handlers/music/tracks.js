const { Track } = require('nyxlink')
const views = new WeakMap()
// These legacy-shaped records are read views of native tracks, not another queue.
function viewTrack(track) {
  if (!track || !(track instanceof Track)) return track || null
  if (!views.has(track)) views.set(track, {
    get encoded() { return track.encoded },
    get info() {
      const who = track.requester || track.userData?.requester
      return { ...track.userData?.obey, ...track.toJSON().info,
        requester: typeof who === 'string' ? who : who?.username || who?.tag || 'Usuario',
        requesterId: typeof who === 'object' ? who?.id : track.userData?.obey?.requesterId }
    },
    get pluginInfo() { return track.pluginInfo },
    get userData() { return track.userData },
    get backend() { return track.backend },
    get _resolvedNode() { return track.origin },
  })
  return views.get(track)
}
function toTrack(record, requester, node) {
  if (record instanceof Track) return record
  const info = record.info || record
  const who = requester || (info.requesterId ? { id: info.requesterId, username: info.requester || 'Usuario' } : info.requester)
  const native = new Track({ encoded: record.encoded, info: { ...info, length: info.length ?? info.duration ?? 0 },
    pluginInfo: record.pluginInfo || {}, userData: { ...record.userData, obey: { ...record.userData?.obey, ...info } } }, who, record._resolvedNode)
  native.backend = record.backend || node?.backend?.kind
  return native
}
module.exports = { toTrack, viewTrack }
