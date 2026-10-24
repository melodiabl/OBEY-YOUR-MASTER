const { findAutoplayTrack } = require('./autoplay')

function createAutoplaySessions(client, { actions, elapsedForState, emitState, rememberTrack, playTrack, idle }) {
  const active = new Map(), pending = new Set()
  function isCurrent(job) {
    const { guildId, state, seed, playbackId, stopEpoch, player } = job
    return active.get(guildId) === job && client.music.playerStates.get(guildId) === state &&
      state.currentTrack === seed && state.playbackId === playbackId && (state.stopRequestEpoch || 0) === stopEpoch &&
      !state.nodeTransition && state.status !== 'recovering' && state.status !== 'stopping' && !client._shuttingDown &&
      client.shoukaku.players.get(guildId) === player
  }
  function release(job) {
    if (active.get(job.guildId) === job) active.delete(job.guildId)
    if (job.state.autoplayLookup === job.controller) {
      job.state.autoplayLookup = null
      job.state.autoplaySearching = false
    }
  }
  function rememberSeed(state, seed) {
    state.history.unshift(seed)
    if (state.history.length > 10) state.history.pop()
  }
  function cancel(guildId, { manual = false } = {}) {
    const job = active.get(guildId)
    if (!job) return
    const current = isCurrent(job)
    job.controller.abort()
    release(job)
    if (manual && current) {
      rememberSeed(job.state, job.seed)
      Object.assign(job.state, { currentTrack: null, lastPosition: 0, startedAt: null, status: 'idle' })
    }
  }
  function reserveManual(guildId) {
    const state = client.music.getState(guildId)
    state.pendingEnqueues = (state.pendingEnqueues || 0) + 1
    state.autoplayLookup?.abort()
    return () => { state.pendingEnqueues-- }
  }
  function start(guildId, player) {
    if (active.has(guildId) && isCurrent(active.get(guildId))) return
    cancel(guildId)
    const state = client.music.getState(guildId)
    const job = { guildId, state, player, seed: state.currentTrack, playbackId: state.playbackId,
      stopEpoch: state.stopRequestEpoch || 0, controller: new AbortController() }
    active.set(guildId, job)
    state.lastPosition = elapsedForState(guildId, state)
    state.startedAt = null
    state.status = 'loading'
    state.autoplayLookup = job.controller
    state.autoplaySearching = true
    emitState(guildId)
    // Lookup may inherit the action's async context. Always enqueue its commit;
    // treating it as a reentrant action would bypass a control already in flight.
    const work = Promise.resolve().then(() => findAutoplayTrack(client.music, guildId, job.seed, [...state.history],
      () => isCurrent(job) && state.autoplay && !state.queue.length && !state.pendingEnqueues, job.controller.signal))
      .catch(() => null)
      .then(pick => actions.enqueue(guildId, async () => {
        if (!isCurrent(job)) return
        if (state.pendingEnqueues) {
          cancel(guildId, { manual: true })
          emitState(guildId)
          return
        }
        release(job)
        if (state.queue.length) return client.music._playNext(guildId, player, { rotate: false })
        if (!pick || !state.autoplay || job.controller.signal.aborted) {
          if (state.autoplay && !job.controller.signal.aborted) console.warn('[Music] Autoplay: no playable new candidates')
          return idle(guildId, player)
        }
        pick.info.requester = state.radioMode ? 'Radio' : 'Autoplay'
        rememberSeed(state, job.seed)
        state.currentTrack = pick
        state.lastPosition = 0
        rememberTrack(guildId, pick)
        await playTrack(guildId, player, state, pick.encoded, { paused: Boolean(state.paused) })
        emitState(guildId)
      }))
      .catch(() => console.warn('[Music] Autoplay transition failed'))
      .finally(() => { release(job); pending.delete(work) })
    pending.add(work)
  }
  return {
    start, cancel, reserveManual,
    suspend() { for (const job of active.values()) job.controller.abort() },
    drain: () => Promise.allSettled([...pending]),
  }
}
module.exports = { createAutoplaySessions }
