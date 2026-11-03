const { allowedMusicTrack } = require('./nodes-config')
const { sameRecording } = require('./recordings')
const { tracksFromResolve } = require('./utils')
const { nodeView } = require('./node-view')
const { viewTrack, toTrack } = require('./tracks')

// Recording selection is OBEY policy. Queue progression and the actual retry
// remain native NyxLink operations. Never displace a queued/user-selected song.
async function recoverRecording(client, id, player, failed = player.current) {
  if (!failed || !['youtube', 'spotify'].includes(failed.sourceName) || failed.userData?.obeyRecoveryAttempted || player.queue.size || player.autoPlay) return false
  const state = client.music.getState(id), playbackId = state.playbackId, epoch = state.stopRequestEpoch || 0
  const eligible = () => !client._shuttingDown && client.music.getState(id) === state && !state.stopRequested &&
    (state.stopRequestEpoch || 0) === epoch && state.playbackId === playbackId && client.music.getPlayer(id) === player &&
    !player.destroyed && !player.queue.size && !player.autoPlay && (!player.current || player.current === failed)
  if (!eligible()) return false
  failed.userData.obeyRecoveryAttempted = true
  const response = await nodeView(player.node).rest.resolve(`amsearch:${failed.title || ''} ${failed.author || ''}`).catch(() => null)
  if (!eligible()) return false
  const row = tracksFromResolve(response).find(row => row.encoded && row.info?.sourceName === 'applemusic' && allowedMusicTrack(row) && sameRecording(viewTrack(failed), row))
  if (!row) return false
  const replacement = toTrack(row, failed.requester, player.node)
  replacement.userData.obeyRecoveryAttempted = true
  return player.play({ track: replacement })
}
module.exports = { recoverRecording }
