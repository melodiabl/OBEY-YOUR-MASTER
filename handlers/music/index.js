const obeyUi = require('../assets/system')
const { randomUUID } = require('node:crypto')
const { playerStates, liveMessages, liveTimers, getState: stateFor, bindState } = require('./state')
const { createActionQueue } = require('./action-queue')
const { toTrack, viewTrack } = require('./tracks')
const { nodeView } = require('./node-view')
const { normalizePublicTrack, clampMs } = require('./utils')
const { allowedMusicTrack, assertMusicQuery } = require('./nodes-config')
const { FILTER_PRESETS, FILTER_RESET, restoreNativeFilters } = require('./filters')
const { musicDefaultsForConnection } = require('../music-default-settings')
const { buildNPEmbed, buildControls, buildQueueEmbed, buildQueueRows } = require('./embeds')
const { toggleLike, buildLikeEmbed } = require('./likes')
const { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate, updatePanel } = require('./liveupdate')
const clock = require('./playback-clock')

module.exports = client => {
  const manager = client.nyxlink
  if (!manager) throw Error('NyxLink no inicializado')
  const actions = createActionQueue(), publications = new Map()
  const sessions = require('./sessions').createSessionRepository(require('../../database/schemas/MusicSessionSchema'))
  const active = id => manager.players.get(id)
  const getState = id => {
    const state = stateFor(id), player = active(id)
    if (!player) return state
    bindState(state, player)
    if (player.current && !state.clockTrack) {
      state.clockTrack = player.current; state.clockSample = player.current.position || 0; state.confirmedPaused = player.paused
      clock.anchor(state, state.clockSample)
    }
    return state
  }
  const current = (id, state, epoch) => !client._shuttingDown && playerStates.get(id) === state && !state.stopRequested && (state.stopRequestEpoch || 0) === epoch
  const cancelled = () => Object.assign(new Error('La solicitud de música se ha cancelado.'), { code: 'music_playback_cancelled' })
  const assertCurrent = (id, state, epoch) => { if (!current(id, state, epoch)) throw cancelled() }
  const required = id => { const player = active(id); if (!player || player.destroyed) throw Error('No hay reproductor activo.'); return player }
  function emitState(id, { persist = true } = {}) {
    const state = getState(id)
    state.revision++
    if (persist && client._dbReady && !client._shuttingDown && !state.nodeTransition && !state.stopRequested) sessions.save(id, state).catch(() => console.warn('[Music] No se pudo guardar la sesión.'))
    client.emit('playerStateUpdate', id)
  }
  function confirmed(id) {
    const state = getState(id), player = active(id)
    state.status = player?.current ? player.paused ? 'paused' : 'playing' : player ? 'idle' : 'disconnected'
    if (player?.current) {
      const sample = Math.max(0, Number(player.current.position) || 0)
      if (state.clockTrack !== player.current || state.clockSample !== sample) clock.anchor(state, sample)
      state.clockTrack = player.current; state.clockSample = sample
    }
    else { state.lastPosition = 0; state.startedAt = null }
    if (player) state.confirmedPaused = player.paused
    emitState(id)
  }
  function publicState(id, options = {}) {
    const state = getState(id), limit = Math.max(1, Math.min(100, Number(options.queueLimit || 50)))
    const base = { node: client.nodePool?.view(id), active: Boolean(state.currentTrack), status: state.status,
      sessionId: state.sessionId, revision: state.revision, volume: state.volume ?? 100, updatedAt: Date.now() }
    if (!state.currentTrack) return base
    const track = normalizePublicTrack(state.currentTrack, { pos: 0, elapsed: clock.position(state) })
    return { ...base, playbackId: state.playbackId, paused: Boolean(state.paused), playbackRate: clock.rate(state), clockRunning: clock.running(state),
      loop: state.loop, autoplay: state.autoplay, radioMode: state.radioMode, shuffle: state.shuffle, filter: state.filter,
      voiceChannelId: state.voiceChannelId, textChannelId: state.textChannelId, current: track,
      queue: [track, ...state.queue.slice(0, limit).map((row, i) => normalizePublicTrack(row, { pos: i + 1 }))],
      queueTotal: state.queue.length, history: state.history.slice(0, 10).map(row => normalizePublicTrack(row)) }
  }
  function remember(id, track) {
    if (!client._dbReady) return
    const info = normalizePublicTrack(viewTrack(track))
    if (!info.uri) return
    require('../../database/schemas/MusicHistorySchema').findOneAndUpdate({ guildId: id, uri: info.uri },
      { $inc: { plays: 1 }, $set: { ...info, lastPlayed: new Date() } }, { upsert: true, new: false }).catch(() => {})
    const { database } = require('./database'), requester = track.requester?.id || track.userData?.obey?.requesterId || 'system'
    database.updateTrackStats(requester, id, viewTrack(track)).catch(() => {})
    if (requester !== 'system') database.updateUserStats(requester, id).catch(() => {})
  }
  async function prepare(id, rows, requester, state, epoch) {
    const result = []
    for (let row of rows) {
      assertCurrent(id, state, epoch)
      if (!allowedMusicTrack(viewTrack(row))) throw Error('source_not_allowed')
      if (!row.encoded) {
        const info = row.info || row, query = info.uri || `${info.title || ''} ${info.author || ''}`.trim()
        const found = await client.music.search(query, requester || info.requester || 'Playlist', { guildId: id })
        assertCurrent(id, state, epoch)
        row = found?.tracks?.find(candidate => candidate.encoded && require('./recordings').sameRecording(row, candidate))
        if (!row) throw Error('No se pudo resolver una canción de la playlist.')
      }
      const player = required(id)
      if (row._resolvedNode && row._resolvedNode !== player.node.identifier) row = await require('./node-search').trackOnNode(row, nodeView(player.node))
      assertCurrent(id, state, epoch)
      result.push(toTrack(row, requester, player.node))
    }
    return result
  }
  client.music = {
    getState, getPublicState: publicState, playerStates, liveMessages,
    getPlayer: active,
    getNode(id) { const node = nodeView(active(id)?.node); return node?.state === 1 ? node : client.nodePool ? client.nodePool.choose(id) : nodeView(manager.nodes.findNode()) },
    getNodes(id) { return client.nodePool?.view(id) },
    getLyricsOptions(id) { const state = getState(id), node = nodeView(active(id)?.node); return { node, encoded: state.currentTrack?.encoded,
      durationMs: state.currentTrack?.info?.length, albumName: state.currentTrack?.info?.albumName,
      lyricsPlugin: Boolean(node?.native?.isNodeLink || client.nodePool?.supportsPlugin(node?.name, 'lavalyrics')) } },
    search(query, requester, context) { return require('./node-search').searchNodes(client, query, requester, context) },
    recommend(seed, requester, context) { return require('./recommendations').recommendTracks(client, seed, requester, context) },
    async joinChannel(id, voiceChannelId, textChannelId, { applyDefaults = true } = {}) {
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      assertCurrent(id, state, epoch)
      let player = active(id)
      if (player) {
        if (player.voiceChannelId !== voiceChannelId) throw Error('El bot ya está en otro canal de voz.')
        if (textChannelId) player.setTextChannelId(textChannelId)
        if (!player.connected) await player.connect({ selfDeaf: true })
        assertCurrent(id, state, epoch)
        if (applyDefaults) await persistence.retry(id, state)
        return player
      }
      const defaults = applyDefaults ? musicDefaultsForConnection(client, id) : { volume: 100, autoplay: false, equalizer: 'off' }, chosen = this.getNode(id)
      if (!chosen || chosen.state !== 1) throw Error('No hay nodos de música disponibles.')
      state.status = 'connecting'
      player = manager.players.create({ guildId: id, voiceChannelId, textChannelId, volume: defaults.volume, autoPlay: defaults.autoplay, selfDeaf: true })
      // NyxLink exposes node as a writable native field; choose it before the
      // first voice connection, when no remote player exists to transfer.
      if (chosen.native) player.node = chosen.native
      bindState(state, player)
      try {
        await player.connect({ selfDeaf: true })
        assertCurrent(id, state, epoch)
        state.locale = require('../i18n').localeFor(client, id)
        if (defaults.equalizer !== 'off') {
          try { await this.setFilter(id, defaults.equalizer); state.defaultEqualizerStatus = 'confirmed' }
          catch { state.filter = 'none'; state.defaultEqualizerStatus = 'unconfirmed' }
        }
        assertCurrent(id, state, epoch)
        client.nodePool?.unpin(id)
        if (applyDefaults) await persistence.retry(id, state)
        assertCurrent(id, state, epoch)
        confirmed(id)
        void require('./nodes-runtime').configureSponsorBlock(player, client.nodePool)
        return player
      } catch (error) {
        await player.destroy('Initial connection failed').catch(() => {})
        state.status = 'disconnected'
        throw error
      }
    },
    async play(id, voice, text, query, requester) {
      assertMusicQuery(query)
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      const result = await this.search(query, requester, { guildId: id })
      assertCurrent(id, state, epoch)
      if (!result?.tracks?.length) return null
      await this.playCollection(id, voice, text, result.loadType === 'playlist' ? result.tracks : [result.tracks[0]], requester)
      return { result, state: getState(id) }
    },
    async playCollection(id, voice, text, rows, requester) {
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      if (!Array.isArray(rows) || !rows.length || rows.some(row => !allowedMusicTrack(viewTrack(row)))) throw Error('invalid_collection')
      return actions.run(id, async () => {
        assertCurrent(id, state, epoch)
        await this.joinChannel(id, voice, text)
        assertCurrent(id, state, epoch)
        return this.enqueue(id, rows, { requester })
      })
    },
    async enqueue(id, rows, { front = false, skip = false, requester } = {}) {
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      if (!Array.isArray(rows) || !rows.length) throw Error('No hay pistas para añadir.')
      return actions.run(id, async () => {
        const tracks = await prepare(id, rows, requester, state, epoch), player = required(id)
        assertCurrent(id, state, epoch)
        if (front) player.queue.insert(0, tracks)
        else player.queue.add(tracks)
        if (skip && player.current) { if (!await player.skip()) throw Error('No se pudo avanzar la reproducción.') }
        else if (!player.playing && !player.current && !await player.play()) throw Error('El nodo no aceptó la reproducción.')
        assertCurrent(id, state, epoch)
        confirmed(id)
        scheduleNpUpdate(client, id)
        return tracks.length
      })
    },
    async _recoverFailedTrack(id, player, reason, failed) {
      const ok = await require('./recording-recovery').recoverRecording(client, id, player, failed)
      if (ok) confirmed(id)
      return ok
    },
    async pause(id) {
      const player = required(id), state = getState(id), elapsed = clock.position(state), track = player.current
      if (player.paused) await player.resume(); else await player.pause()
      if (player.current !== track || player.destroyed) throw cancelled()
      confirmed(id); clock.anchor(state, elapsed); return player.paused
    },
    async skip(id) { getState(id).playbackId = randomUUID(); const player = required(id); if (player.loop === 'track') player.setLoop('off'); const ok = await player.skip(); if (!ok && player.queue.size) throw Error('No se pudo avanzar la reproducción.'); confirmed(id); return ok },
    async previous(id) { getState(id).playbackId = randomUUID(); const player = required(id); const ok = await player.back(); if (!ok) throw Error('No hay una canción anterior disponible.'); confirmed(id); return ok },
    async stop(id) {
      const state = getState(id), player = active(id)
      state.stopRequested = true; state.stopRequestEpoch = (state.stopRequestEpoch || 0) + 1
      state.status = 'stopping'; state.startedAt = null
      persistence.cancel(id, state)
      try {
        // Calling stop now invalidates native pending playback before waiting
        // on either the SDK command queue or application requests.
        if (player) {
          player.setAutoPlay(false)
          const stopping = player.stop()
          if (!player.connected) void player.disconnect().catch(() => {})
          await stopping
        }
        await actions.drain(id)
        await stopLiveUpdate(id)
        if (player) await player.destroy('Stopped by user')
        playerStates.delete(id); liveMessages.delete(id)
        await require('./lyricsLive').stop(id, client).catch(() => {})
        await require('./setup').resetToIdle(client, id).catch(() => {})
        emitState(id, { persist: false })
        const persisted = await persistence.commitStop(id)
        getState(id).stopPersistence = persisted ? 'confirmed' : 'pending'
        emitState(id, { persist: false })
        return { stopped: true, persisted: Boolean(persisted) }
      } catch (error) {
        if (player && !player.destroyed) { state.stopRequested = false; confirmed(id) }
        throw error
      }
    },
    async setVolume(id, value) {
      if (!Number.isInteger(value) || value < 0 || value > 200) throw Error('El volumen debe ser un entero entre 0 y 200.')
      await required(id).setVolumeAsync(value); confirmed(id); scheduleNpUpdate(client, id); return value
    },
    setLoop(id, mode) { required(id).setLoop(['track', 'queue'].includes(mode) ? mode : 'off'); emitState(id); return getState(id).loop },
    setAutoplay(id, enabled = null) { const player = required(id); player.setAutoPlay(enabled == null ? !player.autoPlay : Boolean(enabled)); emitState(id); return player.autoPlay },
    setRadioMode(id, enabled = null) { const state = getState(id); state.radioMode = enabled == null ? !state.radioMode : Boolean(enabled); if (state.radioMode) this.setAutoplay(id, true); emitState(id); return state.radioMode },
    async shuffle(id) { const state = getState(id); state.shuffle = !state.shuffle; if (state.shuffle) required(id).shuffle(); emitState(id); return state.shuffle },
    clearQueue(id) { const player = required(id), count = player.queue.size, enabled = player.autoPlay; player.setAutoPlay(false); player.setAutoPlay(enabled); player.queue.clear(); emitState(id); return count },
    removeDuplicates(id) { const player = required(id), count = player.queue.size; player.queue.removeDuplicates(); emitState(id); return count - player.queue.size },
    async remove(id, position) { const player = required(id); if (!Number.isInteger(position) || position < 1 || position > player.queue.size) throw Error('Posición inválida.'); const row = player.queue.remove(position - 1); emitState(id); return viewTrack(row) },
    async jump(id, position) { const player = required(id); if (!Number.isInteger(position) || position < 1 || position > player.queue.size) throw Error('Posición inválida.'); const ok = await player.skip(position - 1); if (!ok) throw Error('No se pudo avanzar la reproducción.'); confirmed(id); return true },
    async move(id, from, to) { const player = required(id); if (![from, to].every(n => Number.isInteger(n) && n >= 1 && n <= player.queue.size)) throw Error('Posición inválida.'); if (!player.queue.move(from - 1, to - 1)) throw Error('Posición inválida.'); emitState(id); return true },
    async seek(id, value) {
      const player = required(id), state = getState(id)
      if (!player.current || player.current.isStream || player.current.isSeekable === false) throw Error('Esta pista no permite cambiar de posición.')
      if (!Number.isFinite(value) || value < 0) throw Error('Posición inválida.')
      const position = clampMs(value, player.current.duration)
      const track = player.current, epoch = state.stopRequestEpoch || 0
      await player.seek(position)
      assertCurrent(id, state, epoch)
      if (player.current !== track || player.destroyed) throw cancelled()
      clock.anchor(state, position); state.positionChangeAt = Date.now(); confirmed(id)
      scheduleNpUpdate(client, id)
      return { positionMs: position, durationMs: player.current.duration, paused: player.paused }
    },
    seekRelative(id, offset) { if (!Number.isFinite(offset)) throw Error('Posición inválida.'); return this.seek(id, Math.max(0, clock.position(getState(id)) + offset)) },
    async setFilter(id, preset) {
      const player = required(id), state = getState(id)
      if (!['none', 'off'].includes(preset) && !FILTER_PRESETS[preset]) throw Error('Filtro desconocido.')
      const previous = player.filters.toJSON()
      restoreNativeFilters(player.filters, { ...FILTER_RESET, ...(FILTER_PRESETS[preset] || {}) })
      try { await player.filters.apply() }
      catch (error) { restoreNativeFilters(player.filters, previous); throw error }
      state.filter = preset === 'off' ? 'none' : preset; state.defaultEqualizerStatus = 'overridden'; state.customFilters = undefined
      confirmed(id); return state.filter
    },
    async setAudioParameter(id, parameter, value, gain) {
      const player = required(id), state = getState(id), previous = player.filters.toJSON()
      if (parameter === 'equalizer') {
        if (!Number.isInteger(value) || value < 0 || value > 14 || !Number.isFinite(gain) || gain < -0.25 || gain > 1) throw Error('Banda o ganancia inválida.')
        player.filters.setEqualizer([...(player.filters.equalizer || []).filter(band => band.band !== value), { band: value, gain }])
      } else {
        if (!['pitch', 'speed', 'rate'].includes(parameter) || !Number.isFinite(value) || value < 0.25 || value > 2) throw Error('Valor de audio inválido.')
        player.filters.setTimescale({ speed: 1, rate: 1, pitch: 1, ...player.filters.timescale, [parameter]: value })
      }
      try { await player.filters.apply() } catch (error) { restoreNativeFilters(player.filters, previous); throw error }
      state.filter = 'custom'; state.customFilters = player.filters.toJSON(); confirmed(id)
    },
    async relocateVoice(id, request) { return require('./voice-session').relocateVoice(client, id, request, { actions, emitState, confirmed }) },
    async setNodePreference(id, nodeId) {
      if (!client._dbReady || client._shuttingDown || !client.nodePool) throw Error('nodes_unavailable')
      client.nodePool.validateSelection(nodeId)
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      return actions.run(id, async () => {
        assertCurrent(id, state, epoch)
        client.nodePool.unpin(id)
        const target = client.nodePool.choose(id, { preference: nodeId }), player = active(id)
        if (!target) throw Error('node_unavailable')
        state.nodeTransition = true
        try {
          if (player && player.node.identifier !== target.name && !await player.transferNode(target.native)) throw Error('node_change_failed')
          assertCurrent(id, state, epoch)
          await sessions.save(id, { ...state, nodePreference: nodeId })
          state.nodePreference = nodeId
        } finally { state.nodeTransition = false; confirmed(id) }
        return client.nodePool.view(id)
      })
    },
    async sendNowPlaying(guildId, track) {
      const state = getState(guildId)
      if (!state.currentTrack || !state.textChannelId) return
      const setup = require('../music/setup')
      const setupChId = setup.getChannelId(guildId)
      const live = liveMessages.get(guildId)
      if (live?.channelId === (setupChId || state.textChannelId)) {
        if (!liveTimers.has(guildId)) startLiveUpdate(client, guildId)
        await updatePanel(client, guildId)
        return
      }
      await stopLiveUpdate(guildId)
      if (!state.currentTrack || state.status === 'stopping') return

      // El mensaje fijado del canal de peticiones muestra la pista y el progreso.
      if (setupChId) {
        const sm = await setup.updatePanel(client, guildId, { embeds: [buildNPEmbed(client, guildId, state)], components: buildControls(state) })
        if (sm) {
          const old = liveMessages.get(guildId)
          if (old && old.messageId !== sm.id) {
            const oc = client.channels.cache.get(old.channelId)
            oc?.messages.fetch(old.messageId).then(m => m.delete().catch(() => {})).catch(() => {})
          }
          liveMessages.set(guildId, { messageId: sm.id, channelId: setupChId, isSetup: true })
          startLiveUpdate(client, guildId)
          return
        }
      }

      const channel = client.channels.cache.get(state.textChannelId)
      if (!channel) return

      const old = liveMessages.get(guildId)
      if (old) {
        const ch = client.channels.cache.get(old.channelId)
        ch?.messages.fetch(old.messageId).then(m => m.delete().catch(() => {})).catch(() => {})
        liveMessages.delete(guildId)
      }

      const embed = buildNPEmbed(client, guildId, state)
      const msg   = await channel.send({ embeds: [embed], components: buildControls(state) }).catch(() => null)
      if (msg) { liveMessages.set(guildId, { messageId: msg.id, channelId: channel.id }); startLiveUpdate(client, guildId) }
    },

  }

  // ── Button handler ─────────────────────────────────────────────────────────
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    const aliases = { m2_previous: 'mp_prev', m2_pause: 'mp_toggle' }
    const cid = aliases[interaction.customId] || interaction.customId.replace(/^m2_/, 'mp_')
    if (!cid.startsWith('mp_') && !cid.startsWith('mq_')) return
    const guildId = interaction.guild?.id
    if (!guildId || !client.music) return
    const stateForAccess = getState(guildId)
    const actionName = { mp_toggle: 'pause', mp_prev: 'playprevious', mp_skip: 'skip', mp_stop: 'stop', mp_shuffle: 'shuffle', mp_loop: 'loop', mp_voldown: 'volume', mp_volup: 'volume' }[cid]
    if (actionName) {
      const denial = require('./permissions').commandDenial(client, interaction.member, actionName, stateForAccess.currentTrack, { checkDj: true })
      if (denial) return interaction.reply({ content: denial, ephemeral: true })
    }
    if (stateForAccess.voiceChannelId && interaction.member?.voice?.channelId !== stateForAccess.voiceChannelId) {
      await interaction.reply({ content: obeyUi.owned('❌ Debes estar en el mismo canal de voz que el bot.'), ephemeral: true }).catch(() => {})
      return
    }
    const acknowledgement = !interaction.deferred && !interaction.replied
      ? interaction.deferUpdate().catch(() => {}) : Promise.resolve()
    // Permitted node controls can run while Discord confirms the acknowledgement.
    if (!actionName && cid !== 'mp_loop' && cid !== 'mp_autoplay') await acknowledgement

    if (cid.startsWith('mq_')) {
      const state = getState(guildId)
      if (cid === 'mq_close') { await interaction.deleteReply().catch(() => {}); return }
      const [, pageStr] = cid.split(':')
      const cur  = parseInt(pageStr) || 1
      const page = cid.startsWith('mq_next') ? cur + 1 : cur - 1
      const totalPages = Math.max(1, Math.ceil(state.queue.length / 10))
      await interaction.editReply({ embeds: [buildQueueEmbed(state, page)], components: buildQueueRows(page, totalPages, require('../i18n').localeFor(client, guildId)) }).catch(() => {})
      return
    }

    const action = cid.split(':')[0]
    const state  = getState(guildId)
    try {
    switch (action) {
      case 'mp_toggle':   await client.music.pause(guildId); break
      case 'mp_skip':     await client.music.skip(guildId); break
      case 'mp_stop':   { await client.music.stop(guildId); return }
      case 'mp_shuffle':  await client.music.shuffle(guildId); break
      case 'mp_prev':     await client.music.previous(guildId); break
      case 'mp_autoplay': client.music.setAutoplay(guildId); break
      case 'mp_loop': {
        const next = state.loop === 'none' ? 'track' : state.loop === 'track' ? 'queue' : 'none'
        client.music.setLoop(guildId, next); break
      }
      case 'mp_voldown': await client.music.setVolume(guildId, Math.max(0,   state.volume - 10)); break
      case 'mp_volup':   await client.music.setVolume(guildId, Math.min(200, state.volume + 10)); break
      case 'mp_queue': {
        const totalPages = Math.max(1, Math.ceil(state.queue.length / 10))
        interaction.followUp({ embeds: [buildQueueEmbed(state, 1)], components: buildQueueRows(1, totalPages, require('../i18n').localeFor(client, guildId)), ephemeral: true }).catch(() => {})
        return
      }
      case 'mp_like': {
        if (!state.currentTrack) { interaction.followUp({ content: obeyUi.owned('❌ No hay música reproduciéndose.'), ephemeral: true }).catch(() => {}); return }
        const res = await toggleLike(interaction.user.id, state.currentTrack)
        if (res) interaction.followUp({ embeds: [buildLikeEmbed(res)], ephemeral: true }).catch(() => {})
        return
      }
      case 'mp_lyrics': {
        const live = require('../music/lyricsLive')
        if (live.isActive(guildId)) {
          await live.stop(guildId, client)
          interaction.followUp({ content: obeyUi.owned('🔇 Letras en vivo desactivadas.'), ephemeral: true }).catch(() => {})
          return
        }
        const requestedTrack = state.currentTrack, playbackId = state.playbackId, sessionId = state.sessionId
        const isCurrent = () => {
          const latest = getState(guildId)
          return latest.currentTrack === requestedTrack && latest.playbackId === playbackId && latest.sessionId === sessionId
        }
        const r = await live.start(client, guildId)
        if (r.ok) {
          interaction.followUp({ content: obeyUi.owned('🎤 Letras en vivo activadas — se sincronizan solas con la canción.'), ephemeral: true }).catch(() => {})
        } else if (r.reason === 'no_sync' && r.plain) {
          const info = requestedTrack?.info || requestedTrack || {}
          await require('./lyrics-pagination').showLyrics(interaction, { text: r.plain, title: info.title, artist: info.author, isCurrent }, 'followUp')
        } else {
          interaction.followUp({ content: r.reason === 'no_track' ? obeyUi.owned('❌ No hay música reproduciéndose.') : obeyUi.owned('🔇 No encontré letras sincronizadas para esta canción.'), ephemeral: true }).catch(() => {})
        }
        return
      }
    }
    scheduleNpUpdate(client, guildId, { immediate: true })
    } catch (error) {
      await acknowledgement
      console.warn(`[Music] Control failed (${guildId}):`, error.message)
      await interaction.followUp({ content: obeyUi.owned('❌ No se pudo aplicar el control. Inténtalo de nuevo.'), ephemeral: true }).catch(() => {})
    } finally { await acknowledgement }
  })


  // Serialize application metadata with other guild requests. Audio commands
  // themselves still go through NyxLink's native command queue.
  for (const name of ['joinChannel', 'pause', 'skip', 'previous', 'setVolume', 'seek', 'setFilter', 'setAudioParameter', 'jump', 'remove', 'move', 'shuffle']) {
    const operation = client.music[name]
    client.music[name] = function (id, ...args) {
      const state = getState(id), epoch = state.stopRequestEpoch || 0
      return actions.run(id, async () => {
        assertCurrent(id, state, epoch)
        const result = await operation.call(this, id, ...args)
        assertCurrent(id, state, epoch)
        return result
      })
    }
  }

  // Presentation writes coalesce; NyxLink alone advances the audio queue.
  const publish = client.music.sendNowPlaying
  client.music.sendNowPlaying = function (id, ...args) {
    const existing = publications.get(id)
    if (existing) { existing.dirty = true; return existing.promise }
    const item = { dirty: true }
    publications.set(id, item)
    item.promise = (async () => {
      do { item.dirty = false; await publish.call(this, id, ...args) }
      while (item.dirty && !client._shuttingDown && getState(id).currentTrack && !getState(id).stopRequested)
    })().finally(() => { if (publications.get(id) === item) publications.delete(id) })
    return item.promise
  }
  const validPlayer = player => !player.destroyed && !client._shuttingDown && active(player.guildId) === player && !getState(player.guildId).stopRequested
  const panel = player => {
    if (!validPlayer(player)) return
    void client.music.sendNowPlaying(player.guildId, viewTrack(player.current)).catch(() => console.warn('[Music] Panel no disponible.'))
  }
  manager.on('playerTriggeredPlay', (player, track) => {
    if (!validPlayer(player)) return
    const state = getState(player.guildId)
    state.playbackId = randomUUID(); state.confirmedPaused = false; state.status = 'loading'; state.startedAt = null
    state.lastPosition = track.position || 0
    emitState(player.guildId, { persist: false })
  })
  manager.on('trackStart', (player, track) => {
    if (!validPlayer(player) || !player.current) return
    const state = getState(player.guildId)
    // The SDK resets position/pause before publishing TrackStart. A delayed
    // event must not undo a confirmed seek/pause or mutate the next song.
    if (state.clockTrack === player.current && (track.encoded !== player.current.encoded || state.status !== 'loading')) {
      player.current.position = state.clockSample ?? state.lastPosition
      player.paused = Boolean(state.confirmedPaused)
    }
    if (track.encoded !== player.current.encoded) return
    if (state.status === 'loading' && state.lastPosition > 0) player.current.position = state.lastPosition
    state.confirmedPlaybackId = state.playbackId
    confirmed(player.guildId); remember(player.guildId, player.current); panel(player)
    if (require('./lyricsLive').isActive(player.guildId)) {
      void require('./lyricsLive').start(client, player.guildId).catch(() => {})
    }
  })
  manager.on('playerUpdate', (player, track, payload) => {
    if (!validPlayer(player) || !player.current) return
    const state = getState(player.guildId), elapsed = clock.nodePosition(state, payload.state)
    if (elapsed !== null) { clock.anchor(state, elapsed); state.clockTrack = player.current; state.clockSample = player.current.position }
    state.status = payload.state?.connected === false ? 'recovering' : player.paused ? 'paused' : 'playing'
    emitState(player.guildId, { persist: false })
  })
  for (const event of ['queueAdd', 'queueRemove', 'playerChangedLoop', 'playerChangedVolume', 'playerResumed', 'playerSwitchedNode', 'playerStop', 'queueEnd']) manager.on(event, player => {
    if (!validPlayer(player)) return
    confirmed(player.guildId)
    if (player.current) panel(player)
    else {
      void stopLiveUpdate(player.guildId).catch(() => {})
      void require('./setup').resetToIdle(client, player.guildId).catch(() => {})
    }
  })
  manager.on('trackException', (player, track) => {
    if (!validPlayer(player)) return
    void client.music._recoverFailedTrack(player.guildId, player, null, track).catch(() => console.warn('[Music] No se pudo recuperar la grabación.'))
  })
  for (const event of ['playerResuming', 'playerDisconnected', 'playerRecoveryFailed']) manager.on(event, player => {
    if (!validPlayer(player)) return
    const state = getState(player.guildId)
    state.lastPosition = clock.position(state); state.startedAt = null; state.status = 'recovering'
    emitState(player.guildId, { persist: false })
  })
  const persistence = require('./session-lifecycle').attachSessionLifecycle(client, { sessions, actions, getState, emitState, publications })
  client.music.restoreSessions = persistence.restore
  client.music.flushSessions = persistence.flush
}
