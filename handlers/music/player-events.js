const { getState, playerStates, liveMessages } = require('./state')
const { stopLiveUpdate } = require('./liveupdate')
module.exports = function bindPlayerEvents(client, player, guildId, { emitState, elapsedForState, requestRecovery }) {
  let events = Promise.resolve()
  const isCurrent = data => {
    if (client.shoukaku?.players?.get(guildId) && client.shoukaku.players.get(guildId) !== player) return false
    const eventId = data?.track?.userData?.obeyPlaybackId
    if (eventId && eventId !== getState(guildId).playbackId) return false
    const encoded = data?.track?.encoded || (typeof data?.track === 'string' ? data.track : null)
    return !encoded || encoded === getState(guildId).currentTrack?.encoded
  }
  const enqueueEvent = (data, operation) => {
    const playbackId = getState(guildId).playbackId
    const currentTrack = getState(guildId).currentTrack
    events = events.then(async () => {
      if (playbackId === getState(guildId).playbackId && currentTrack === getState(guildId).currentTrack && isCurrent(data)) await operation()
    }).catch(error => console.error(`[Music] Player event failed (${guildId}):`, error?.message || error))
  }
  player.on('end', data => {
    if (['replaced', 'stopped'].includes(data?.reason)) return
    if (!isCurrent(data)) { console.warn('[Music] Ignored end event:', data?.reason, 'playbackMatches=', !data?.track?.userData?.obeyPlaybackId || data.track.userData.obeyPlaybackId === getState(guildId).playbackId, 'trackMatches=', data?.track?.encoded === getState(guildId).currentTrack?.encoded); return }
    enqueueEvent(data, async () => {
      if (data?.reason === 'loadFailed') await client.music._recoverFailedTrack(guildId, player, 'loadFailed')
      else await client.music._playNext(guildId, player)
    })
  })
  player.on('start', data => {
    if (!isCurrent(data)) return
    const state = getState(guildId)
    const options = state.playbackOptions || {}
    state.lastPosition = options.position || 0; state.paused = Boolean(options.paused)
    state.startedAt = state.paused ? null : Date.now() - state.lastPosition
    state.status = state.paused ? 'paused' : 'playing'
    emitState(guildId)
    if (state.currentTrack) client.music.sendNowPlaying(guildId, state.currentTrack)
      .catch(error => console.error(`[Music] Panel update failed (${guildId}):`, error.message))
  })
  player.on('update', data => {
    if (client.shoukaku?.players?.get(guildId) && client.shoukaku.players.get(guildId) !== player) return
    const state    = playerStates.get(guildId)
    const position = Number(data?.state?.position)
    if (!state?.currentTrack || !Number.isFinite(position) || !['playing', 'paused'].includes(state.status)) return
    if (state.paused) return
    const timestamp = Number(data?.state?.time)
    if (Number.isFinite(timestamp) && timestamp < (state.lastPlayerUpdateTime || 0)) return
    const expected = elapsedForState(guildId, state)
    if (state.positionChangeAt && Date.now() - state.positionChangeAt < 5000 && Math.abs(position - expected) > 5000) return
    if (Number.isFinite(timestamp)) state.lastPlayerUpdateTime = timestamp
    state.lastPosition = position
    if (!state.paused) state.startedAt = Date.now() - position
  })
  player.on('exception', data => {
    console.error('[Music] Error de reproducción; se intentará recuperar la pista')
    enqueueEvent(data, () => client.music._recoverFailedTrack(guildId, player, data?.exception?.message))
  })
  player.on('stuck', data => {
    console.warn(`[Music] Track stuck (${guildId}), attempting recovery`)
    enqueueEvent(data, () => client.music._recoverFailedTrack(guildId, player, 'trackStuck'))
  })
  player.on('closed', () => {
    if (getState(guildId).nodeTransition) return
    if (client.shoukaku?.players?.get(guildId) && client.shoukaku.players.get(guildId) !== player) return
    stopLiveUpdate(guildId)
    const state = getState(guildId)
    state.lastPosition = elapsedForState(guildId, state)
    state.status = 'recovering'
    state.reconnectVoice = true
    state.startedAt = null
    liveMessages.delete(guildId)
    emitState(guildId)
    if (state.currentTrack && !client._shuttingDown) requestRecovery?.()
  })
}
