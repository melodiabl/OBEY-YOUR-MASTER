const { createRecoveryPolicy } = require('./recovery-policy')
const { toTrack } = require('./tracks')
const { nodeView } = require('./node-view')
const { allowedMusicTrack } = require('./nodes-config')
const clock = require('./playback-clock')

// Mongo is the durable OBEY session store. NyxLink owns live players and its
// recovery; this adapter restores only sessions left by a previous process.
function attachSessionLifecycle(client, { sessions, actions, getState, emitState, publications }) {
  const recovery = createRecoveryPolicy(), restoringGuilds = new Set(), cancelledGuilds = new Set(), pendingStops = new Map()
  let loading = false, preferencesLoaded = false, retry, disposed = false
  const schedule = () => {
    if (disposed || client._shuttingDown || retry) return
    retry = setTimeout(() => { retry = null; void restore() }, 5000)
    retry.unref()
  }
  async function restore() {
    if (disposed || client._shuttingDown || !client._dbReady || loading) return
    if (!client.music.getNode()) { schedule(); return }
    loading = true
    try {
      await sessions.drain()
      if (!preferencesLoaded) {
        for (const row of await sessions.preferences()) if (client.guilds.cache.has(row.guildId)) getState(row.guildId).nodePreference = row.nodePreference || 'auto'
        preferencesLoaded = true
      }
      for (const saved of await sessions.list()) {
        const id = saved.guildId
        if (cancelledGuilds.has(id)) continue
        if (!client.guilds.cache.has(id) || !client.channels.cache.has(saved.voiceChannelId) || client.nyxlink.players.has(id)) continue
        if (!recovery.eligible(id)) { if (recovery.delay(id) !== null) schedule(); continue }
        const state = getState(id), epoch = state.stopRequestEpoch || 0
        const assertCurrent = () => {
          if (disposed || client._shuttingDown || cancelledGuilds.has(id) || state.stopRequested || state !== getState(id) || (state.stopRequestEpoch || 0) !== epoch) throw Error('restore_cancelled')
        }
        restoringGuilds.add(id)
        try {
          await actions.run(id, async () => {
            assertCurrent()
            state.nodeTransition = true; state.status = 'recovering'
            const player = await client.music.joinChannel(id, saved.voiceChannelId, saved.textChannelId, { applyDefaults: false })
            assertCurrent()
            state.sessionId = saved.sessionId || state.sessionId
            state.revision = Math.max(state.revision, saved.revision || 0)
            player.queue.add((saved.queue || []).filter(allowedMusicTrack).map(row => toTrack(row, null, player.node)))
            player.previous = (saved.history || []).filter(allowedMusicTrack).slice().reverse().map(row => toTrack(row, null, player.node))
            await player.setVolumeAsync(saved.volume ?? 100)
            assertCurrent()
            player.setLoop(['track', 'queue'].includes(saved.loop) ? saved.loop : 'off')
            player.setAutoPlay(Boolean(saved.autoplay))
            state.shuffle = Boolean(saved.shuffle); state.radioMode = Boolean(saved.radioMode)
            if (saved.filter === 'custom' && saved.customFilters) {
              require('./filters').restoreNativeFilters(player.filters, saved.customFilters)
              await player.filters.apply(); state.filter = 'custom'; state.customFilters = saved.customFilters
            } else await client.music.setFilter(id, saved.filter || 'off')
            assertCurrent()
            if (saved.currentTrack && allowedMusicTrack(saved.currentTrack)) {
              // Encodings may be tied to another public node. Preserve recording
              // identity while resolving on the selected backend.
              const row = await require('./node-search').trackOnNode(saved.currentTrack, nodeView(player.node))
              assertCurrent()
              if (!await player.play({ track: toTrack(row, null, player.node), position: saved.position || 0 })) throw Error('restore_play_failed')
              assertCurrent()
              if (saved.paused) await player.pause()
            } else if (player.queue.size && !await player.play()) throw Error('restore_play_failed')
            assertCurrent()
            state.nodeTransition = false
            state.status = player.current ? player.paused ? 'paused' : 'playing' : 'idle'
            clock.anchor(state, saved.position || 0)
            emitState(id)
            if (player.current) await client.music.sendNowPlaying(id).catch(() => {})
            recovery.succeeded(id)
          })
        } catch {
          // Retain the durable snapshot on failure. A later bounded attempt may
          // use a healthy node; never overwrite it with an empty partial join.
          const failure = recovery.failed(id)
          const player = client.nyxlink.players.get(id)
          if (player && state === getState(id) && !state.stopRequested) await player.destroy('Session restoration failed').catch(() => {})
          state.nodeTransition = false; state.status = 'recovering'
          console.warn('[Music] No se pudo restaurar la sesión (' + failure.attempts + '/5).')
          if (!failure.exhausted && !state.stopRequested) schedule()
        } finally { restoringGuilds.delete(id) }
      }
    } catch { console.warn('[Music] No se pudieron consultar las sesiones guardadas.'); schedule() }
    finally { loading = false }
  }
  async function flush() {
    if (client._shuttingDown) {
      disposed = true; clearInterval(checkpoint); clearTimeout(retry)
      require('./lyricsLive').suspend()
    }
    await require('./lyricsLive').flush()
    await actions.drain()
    await Promise.allSettled([...publications.values()].map(item => item.promise))
    if (client._dbReady) for (const id of pendingStops.keys()) { const player = client.nyxlink.players.get(id); if (!player?.current || getState(id).stopRequested) await commitStop(id) }
    if (client._dbReady) for (const player of client.nyxlink.players.all) {
      const state = getState(player.guildId)
      if (!player.destroyed && !state.stopRequested && !restoringGuilds.has(player.guildId) && !state.nodeTransition) {
        if (cancelledGuilds.has(player.guildId)) await retrySession(player.guildId, state)
        else await sessions.save(player.guildId, state)
      }
    }
    await sessions.drain()
  }
  const checkpoint = setInterval(() => {
    if (!client._dbReady || disposed || client._shuttingDown) return
    for (const id of pendingStops.keys()) { const player = client.nyxlink.players.get(id); if (!player?.current || getState(id).stopRequested) void commitStop(id).catch(() => {}) }
    for (const player of client.nyxlink.players.all) {
      const state = getState(player.guildId)
      if (!player.destroyed && player.current && !state.stopRequested && !state.nodeTransition && !restoringGuilds.has(player.guildId)) (cancelledGuilds.has(player.guildId) ? retrySession(player.guildId, state) : sessions.save(player.guildId, state)).catch(() => console.warn('[Music] No se pudo guardar el punto de reproducción.'))
    }
  }, 5000)
  checkpoint.unref()
  client.nyxlink.on('nodeReady', () => { void restore() })
  client.once('dbReady', async () => {
    await require('./setup').load(client)
    await restore()
    await require('./lyricsLive').restore(client)
    try {
      for (const row of await require('./database').database.getAll247()) {
        if (cancelledGuilds.has(row.id) || client.nyxlink.players.has(row.id) || getState(row.id).status === 'recovering' || restoringGuilds.has(row.id)) continue
        if (row.radioSource && await require('./radio-setup').restoreRadio(client, row)) continue
        if (client.channels.cache.get(row.channel247Id)?.guild) await client.music.joinChannel(row.id, row.channel247Id, row.text247Id || row.channel247Id)
      }
    } catch { console.warn('[Music] No se pudo restaurar un canal 24/7.') }
  })
  function cancel(id, state) {
    cancelledGuilds.add(id); recovery.cancel(id)
    pendingStops.set(id, { ...state, currentTrack: null, queue: [], history: [], voiceChannelId: null, startedAt: null, lastPosition: 0 })
  }
  async function commitStop(id) {
    const snapshot = pendingStops.get(id)
    if (!snapshot) return
    // Playback is cancelled locally while Mongo is unavailable. Keep the
    // tombstone for a later checkpoint; no recovery retry may bypass it.
    if (!client._dbReady) return false
    try { await sessions.save(id, snapshot) }
    catch { throw Object.assign(Error('No se pudo confirmar el guardado de la detención.'), { code: 'music_stop_persistence_unconfirmed' }) }
    if (pendingStops.get(id) === snapshot) pendingStops.delete(id)
    return true
  }
  async function retrySession(id, state) {
    if (!cancelledGuilds.has(id)) { recovery.retry(id); return }
    const tombstone = pendingStops.get(id), player = client.nyxlink.players.get(id)
    if (!client._dbReady || !player?.connected || player.destroyed) return
    // A failed new request must never discard a pending Stop. A replacement
    // session releases cancellation only once Mongo acknowledges its snapshot.
    await sessions.save(id, state)
    if (pendingStops.get(id) !== tombstone || state.stopRequested || getState(id) !== state || client.nyxlink.players.get(id) !== player) return
    cancelledGuilds.delete(id); pendingStops.delete(id); recovery.retry(id)
  }
  return { restore, flush, cancel, commitStop, retry: retrySession }
}
module.exports = { attachSessionLifecycle }
