const http = require('http')
const MusicHistory = require('../../database/schemas/MusicHistorySchema')

const { playerStates, liveMessages, liveTimers, getState, resetState } = require('./state')
const { normalizePublicTrack, tracksFromResolve, clampMs } = require('./utils')
const { FILTER_PRESETS, FILTER_RESET } = require('./filters')
const { buildNPEmbed, buildControls, buildQueueEmbed, buildQueueRows } = require('./embeds')
const { toggleLike, buildLikeEmbed } = require('./likes')
const { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate } = require('./liveupdate')

const SEARCH_PREFIXES = ['spsearch', 'ytsearch']

function normalizedSongText(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\([^)]*(official|video|lyrics|audio)[^)]*\)/g, '')
    .replace(/\[[^\]]*(official|video|lyrics|audio)[^\]]*\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim()
}

function sameSong(a, b) {
  const title = normalizedSongText(a?.title)
  const candidateTitle = normalizedSongText(b?.title)
  const artist = normalizedSongText(a?.author).split(' feat ')[0]
  const candidateArtist = normalizedSongText(b?.author)
  return Boolean(title && artist && candidateArtist && title === candidateTitle &&
    (candidateArtist === artist || candidateArtist.includes(artist) || artist.includes(candidateArtist)))
}

// SponsorBlock: segmentos a saltar automáticamente en tracks de YouTube
// (music_offtopic = partes sin música en videoclips; sponsor/selfpromo = anuncios)
const SPONSORBLOCK_CATEGORIES = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic']

module.exports = client => {
  if (!client.shoukaku) {
    console.warn('[Music] Shoukaku no inicializado'.yellow)
    return
  }

  const actions = require('./action-queue').createActionQueue()
  const playRequests = require('./action-queue').createActionQueue()
  const sessions = require('./sessions').createSessionRepository(require('../../database/schemas/MusicSessionSchema'))
  const volumeWrites = new Map()
  const confirmedVolumes = new Map()
  const panels = require('./action-queue').createActionQueue()

  async function playTrack(player, state, encoded, options = {}) {
    state.playbackId = require('node:crypto').randomUUID()
    state.playbackOptions = { position: options.position || 0, paused: Boolean(options.paused) }
    state.status = 'loading'
    state.positionChangeAt = Date.now()
    return player.playTrack({ ...options, track: { encoded, userData: { obeyPlaybackId: state.playbackId } } })
  }

  function emitState(guildId) {
    const state = playerStates.get(guildId)
    if (state) {
      state.revision++
      if (!state.currentTrack && state.status !== 'connecting') state.status = client.shoukaku?.players?.has(guildId) ? 'idle' : 'disconnected'
      if (client._dbReady && !client._shuttingDown) sessions.save(guildId, state).catch(error => console.error('[Music] Session persistence:', error.message))
    }
    try { client?.emit?.('playerStateUpdate', guildId) } catch {}
  }

  function getNode() {
    return client.shoukaku?.options?.nodeResolver(client.shoukaku.nodes)
  }

  // Activa SponsorBlock en el player (config por-player del plugin)
  function applySponsorBlock(player, guildId) {
    const sessionId = player?.node?.sessionId
    if (!sessionId) return
    const body = JSON.stringify(SPONSORBLOCK_CATEGORIES)
    const req = http.request({
      host: process.env.LAVALINK_HOST || '127.0.0.1',
      port: Number(process.env.LAVALINK_PORT || 2333),
      path: `/v4/sessions/${sessionId}/players/${guildId}/sponsorblock/categories`,
      method: 'PUT',
      headers: {
        Authorization: process.env.LAVALINK_PASSWORD || '',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 5000,
    }, res => {
      if (res.statusCode !== 204) console.warn(`[Music] SponsorBlock no aplicado (HTTP ${res.statusCode})`)
      res.resume()
    })
    req.on('error', e => console.warn('[Music] SponsorBlock error:', e.message))
    req.end(body)
  }

  function syncState(guildId, state) {
    const player = client.shoukaku?.players?.get(guildId)
    return player
  }

  function elapsedForState(guildId, state, positionMs = null) {
    const player = syncState(guildId, state)
    const len = Number((state.currentTrack?.info || state.currentTrack)?.length || 0)
    if (positionMs !== null && Number.isFinite(Number(positionMs))) return clampMs(positionMs, len)
    if (state.paused) return clampMs(state.lastPosition ?? player?.position ?? 0, len)
    if (state.startedAt) return clampMs(Date.now() - state.startedAt, len)
    return clampMs(player?.position || 0, len)
  }

  function serializeState(guildId, options = {}) {
    const state = playerStates.get(guildId)
    if (!state?.currentTrack) return { active: false, status: state?.status || 'disconnected', sessionId: state?.sessionId || null, revision: state?.revision || 0, volume: state?.volume ?? 100, updatedAt: Date.now() }
    const queueLimit = Math.max(1, Math.min(100, Number(options.queueLimit || 50)))
    const elapsed    = elapsedForState(guildId, state)
    const current    = normalizePublicTrack(state.currentTrack, { pos: 0, elapsed })
    const queue      = (state.queue || []).slice(0, queueLimit).map((t, i) => normalizePublicTrack(t, { pos: i + 1 }))
    return {
      active:         true,
      sessionId:      state.sessionId,
      revision:       state.revision,
      status:         state.paused ? 'paused' : state.status,
      paused:         Boolean(state.paused),
      loop:           state.loop || 'none',
      volume:         state.volume ?? 100,
      autoplay:       Boolean(state.autoplay),
      radioMode:      Boolean(state.radioMode),
      shuffle:        Boolean(state.shuffle),
      filter:         state.filter || 'none',
      voiceChannelId: state.voiceChannelId || null,
      textChannelId:  state.textChannelId  || null,
      current,
      queue:          [current, ...queue],
      queueTotal:     (state.queue || []).length,
      history:        (state.history || []).slice(0, 10).map(t => normalizePublicTrack(t)),
      updatedAt:      Date.now(),
    }
  }

  function rememberTrack(guildId, track) {
    if (!client._dbReady) return
    const info = normalizePublicTrack(track)
    if (!info.uri) return
    MusicHistory.findOneAndUpdate(
      { guildId, uri: info.uri },
      {
        $inc: { plays: 1 },
        $set: {
          title: info.title, author: info.author, artworkUrl: info.artworkUrl,
          length: info.length, sourceName: info.sourceName, albumName: info.albumName,
          releaseDate: info.releaseDate, isrc: info.isrc,
          requester: info.requester, lastPlayed: new Date(),
        },
      },
      { upsert: true, new: false },
    ).catch(() => {})

    // Stats v2 (alimentan /api/top/* y /api/music/recent/*)
    try {
      const { database } = require('../music/database')
      const reqId = (track.info || track)?.requesterId || 'system'
      database.updateTrackStats(reqId, guildId, track).catch(() => {})
      if (reqId !== 'system') database.updateUserStats(reqId, guildId).catch(() => {})
    } catch {}
  }

  client.music = {
    getState,
    getPublicState: serializeState,
    playerStates,
    liveMessages,

    // ── Search via Lavalink: Spotify fallback, then yt-dlp/YouTube ───────
    async search(query, requester) {
      const node  = getNode()
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      const rName = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown'
      if (typeof query !== 'string' || !query.trim()) throw new Error('Indica una canción o enlace válido.')
      query = query.trim()
      if (/soundcloud\.com|^scsearch:|^soundcloud:/i.test(query)) throw new Error('SoundCloud está desactivado. Usa YouTube o un enlace compatible.')
      const isUrl = /^https?:\/\//i.test(query) || /^(spotify|applemusic|deezer|ytsearch|ytmsearch|spsearch|amsearch|ytdlp):/i.test(query)

      const identifiers = isUrl
        ? [query]
        : SEARCH_PREFIXES.map(p => `${p}:${query}`)

      let searchError = null
      let singleFallback = null // spsearch devuelve 1 track; guardarlo y seguir buscando lista

      for (const id of identifiers) {
        try {
          const res    = await node.rest.resolve(id)
          const tracks = tracksFromResolve(res)
          if (!tracks.length) continue
          tracks.forEach(t => { if (t.info) { t.info.requester = rName; t.info.requesterId = (requester && typeof requester === 'object') ? requester.id : (t.info.requesterId || null) } })
          // spsearch devuelve 1 pista (loadType:track): guardarla y seguir a por la lista
          if (res.loadType === 'track' && !isUrl) {
            singleFallback = { loadType: res.loadType, tracks, playlistName: null }
            continue
          }
          // Mantener el resultado único de Spotify como alternativa a la lista.
          const merged = singleFallback ? [...tracks, singleFallback.tracks[0]] : tracks
          return { loadType: res.loadType, tracks: merged, playlistName: res.data?.info?.name || null }
        } catch (error) { searchError = error }
      }
      if (!singleFallback && searchError) {
        console.warn('[Music] Search failed:', /sign in|not a bot/i.test(searchError.message) ? 'YouTube rejected the network exit' : searchError.name)
        throw new Error(/sign in|not a bot/i.test(searchError.message) ? 'YouTube está rechazando esta salida de red. Reintenta en unos minutos.' : 'No se pudo consultar el proveedor de música. Reintenta en unos minutos.')
      }
      return singleFallback
    },

    // ── High-level play ────────────────────────────────────────────────────
    async play(guildId, voiceChannelId, textChannelId, query, requester) {
      const requestedState = getState(guildId)
      const requestEpoch = requestedState.requestEpoch || 0
      return playRequests.run(guildId, async () => {
        const result = await this.search(query, requester)
        if (!result?.tracks?.length) return null
        return actions.run(guildId, async () => {
          if (client._shuttingDown || getState(guildId) !== requestedState || (requestedState.requestEpoch || 0) !== requestEpoch) throw new Error('La solicitud se canceló al detener o vaciar el reproductor.')
          await this.joinChannel(guildId, voiceChannelId, textChannelId)
          const toAdd = result.loadType === 'playlist' ? result.tracks : [result.tracks[0]]
          await this.enqueue(guildId, toAdd)
          return { result, state: getState(guildId) }
        })
      })
    },

    async enqueue(guildId, tracks, { front = false, skip = false } = {}) {
      if (!Array.isArray(tracks) || !tracks.length) throw new Error('No hay pistas para añadir.')
      const state = getState(guildId)
      if (front) state.queue.unshift(...tracks)
      else state.queue.push(...tracks)
      emitState(guildId)
      if (skip && state.currentTrack) await this.skip(guildId)
      else if (!state.currentTrack) await this._playNext(guildId)
      scheduleNpUpdate(client, guildId)
      return tracks.length
    },

    async setAudioParameter(guildId, parameter, value, gain) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) throw new Error('No hay reproductor activo.')
      const state = getState(guildId)
      let filters
      if (parameter === 'equalizer') {
        if (!Number.isInteger(value) || value < 0 || value > 14 || !Number.isFinite(gain) || gain < -0.25 || gain > 1) throw new Error('Usa una banda de 0 a 14 y ganancia entre -0.25 y 1.')
        const equalizer = (player.filters?.equalizer || []).filter(band => band.band !== value)
        filters = { ...FILTER_RESET, equalizer: [...equalizer, { band: value, gain }] }
      } else {
        if (!['pitch', 'speed', 'rate'].includes(parameter) || !Number.isFinite(value) || value < 0.25 || value > 2) throw new Error('Usa un valor entre 0.25 y 2.')
        filters = { ...FILTER_RESET, timescale: { speed: 1, pitch: 1, rate: 1, ...player.filters?.timescale, [parameter]: value } }
      }
      await player.setFilters(filters)
      state.filter = 'custom'
      state.customFilters = filters
      emitState(guildId)
    },

    // ── Join voice channel ─────────────────────────────────────────────────
    async joinChannel(guildId, voiceChannelId, textChannelId) {
      const existing = client.shoukaku?.players?.get(guildId)
      if (existing && existing.node?.ws?.readyState === 1 && !getState(guildId).reconnectVoice) {
        const current = getState(guildId)
        if (current.voiceChannelId && current.voiceChannelId !== voiceChannelId) throw new Error('El bot ya está en otro canal de voz. Detén la sesión antes de cambiar de canal.')
        if (textChannelId) current.textChannelId = textChannelId
        return existing
      }
      const node = getNode()
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      if (existing) {
        try { await client.shoukaku.leaveVoiceChannel(guildId) } catch {}
        const s = getState(guildId)
        s.currentTrack = null; s.startedAt = null; s.paused = false
        stopLiveUpdate(guildId)
      }
      getState(guildId).status = 'connecting'
      const player = await client.shoukaku.joinVoiceChannel({ guildId, channelId: voiceChannelId, shardId: 0 })
      const state  = getState(guildId)
      state.status = 'idle'
      state.voiceChannelId = voiceChannelId
      state.textChannelId  = textChannelId
      const autoplay = client.settings?.get?.(guildId, 'autoplay')
      if (typeof autoplay === 'boolean') state.autoplay = autoplay
      const defaultVolume = Number(client.settings?.get?.(guildId, 'defaultVolume'))
      if (client.settings?.get?.(guildId, 'defaultVolume') != null && defaultVolume >= 0 && defaultVolume <= 200 && typeof player.setGlobalVolume === 'function') {
        try {
          await player.setGlobalVolume(defaultVolume)
          state.volume = defaultVolume
        } catch (error) {
          console.warn('[Music] No se pudo aplicar el volumen por defecto:', error?.message || error)
        }
      }
      this._bindPlayerEvents(player, guildId)
      emitState(guildId)
      applySponsorBlock(player, guildId)
      return player
    },

    // ── Play next in queue ─────────────────────────────────────────────────
    async _playNext(guildId, player, { failed = false, rotate = true } = {}) {
      const state = getState(guildId)
      if (!player) player = client.shoukaku?.players?.get(guildId)
      if (!player) return

      if (!failed && state.loop === 'track' && state.currentTrack?.encoded) {
        state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
        await playTrack(player, state, state.currentTrack.encoded)
        emitState(guildId)
        return
      }

      if (!failed && rotate && state.loop === 'queue' && state.currentTrack) state.queue.push(state.currentTrack)

      let next = state.shuffle && state.queue.length > 1
        ? state.queue.splice(Math.floor(Math.random() * state.queue.length), 1)[0]
        : state.queue.shift()

      if (!next) {
        if (state.autoplay && state.currentTrack) {
          const seed = state.currentTrack?.info || state.currentTrack
          const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, ' ').trim()
          const recentTracks = [state.currentTrack, ...state.history].map(t => t?.info || t).filter(Boolean)
          const playedUris   = new Set(recentTracks.map(t => t.uri).filter(Boolean))
          const playedTitles = new Set(recentTracks.map(t => norm(t.title)).filter(Boolean))
          try {
            const node = getNode()
            // Buscar por artista (no por título: devolvería la misma canción en bucle)
            const queries = [
              `ytsearch:${seed.author || seed.title}`,
              `ytsearch:${seed.title} ${seed.author || ''} mix`,
            ]
            let candidates = []
            for (const q of queries) {
              const res = await node.rest.resolve(q).catch(() => null)
              candidates.push(...tracksFromResolve(res))
            }
            candidates = candidates.filter(t =>
              t.encoded && t.info?.uri &&
              !playedUris.has(t.info.uri) &&
              !playedTitles.has(norm(t.info.title))
            )
            const pick = candidates[Math.floor(Math.random() * Math.min(8, candidates.length))] || candidates[0]
            if (pick) {
              if (pick.info) pick.info.requester = state.radioMode ? 'Radio' : 'Autoplay'
              state.history.unshift(state.currentTrack); if (state.history.length > 10) state.history.pop()
              state.currentTrack = pick; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
              rememberTrack(guildId, pick)
              await playTrack(player, state, pick.encoded)
              emitState(guildId)
              return
            }
            console.warn(`[Music] Autoplay sin candidatos para "${seed.title}" (${guildId})`)
          } catch (e) {
            console.error('[Music] Autoplay error:', e?.message || e)
          }
        }

        state.currentTrack = null; state.startedAt = null; state.lastPosition = 0; state.paused = false
        await stopLiveUpdate(guildId)
        liveMessages.delete(guildId)
        await player.stopTrack()
        try { require('../music/lyricsLive').stop(guildId, client) } catch {}
        try { await require('../music/setup').resetToIdle(client, guildId) } catch (error) { console.warn('[Music] Idle panel:', error.message) }
        emitState(guildId)
        return
      }

      // Resolución lazy: tracks de playlists guardadas vienen sin encoded
      if (!next.encoded) {
        const info = next.info || next
        const q    = info.uri || `${info.title || ''} ${info.author || ''}`.trim()
        const resolved = q ? await this.search(q, info.requester || 'Playlist').catch(() => null) : null
        const real = resolved?.tracks?.find(t => t.encoded)
        if (!real) return this._playNext(guildId, player, { failed: true }) // irrecuperable → siguiente
        if (real.info) { real.info.requester = info.requester || real.info.requester; real.info.requesterId = info.requesterId || real.info.requesterId }
        next = real
      }

      if (state.currentTrack) { state.history.unshift(state.currentTrack); if (state.history.length > 10) state.history.pop() }
      state.currentTrack = next; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
      rememberTrack(guildId, next)
      state.status = 'loading'
      await playTrack(player, state, next.encoded)
      emitState(guildId)
    },

    async _recoverFailedTrack(guildId, player, errorMessage) {
      const state  = getState(guildId)
      state.status = 'recovering'
      emitState(guildId)
      const failed = state.currentTrack
      if (!failed || failed._fallbackAttempted) { await this._playNext(guildId, player, { failed: true }); return }
      failed._fallbackAttempted = true
      const info = failed.info || failed
      try {
        const node = getNode()
        // JioSaavn ofrece audio directo cuando YouTube bloquea la carga del vídeo.
        // Solo se usa si título y artista coinciden para evitar otra grabación.
        if (info.sourceName === 'youtube' || info.sourceName === 'spotify') {
          const direct = await node.rest.resolve(`jssearch:${info.title || ''} ${info.author || ''}`).catch(() => null)
          const replacement = tracksFromResolve(direct).find(t => t.encoded && t.info?.sourceName === 'jiosaavn' && sameSong(info, t.info))
          if (replacement) {
            replacement.info.requester = info.requester || 'Fallback'
            replacement.info.requesterId = info.requesterId
            replacement._fallbackAttempted = true
            state.currentTrack = replacement; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
            await playTrack(player, state, replacement.encoded)
            emitState(guildId)
            return
          }
        }
        const res  = await node.rest.resolve(`ytsearch:${info.title || ''} ${info.author || ''}`)
        const fallback = tracksFromResolve(res).find(t => t.encoded && t.info?.uri !== info.uri)
        if (fallback) {
          if (fallback.info) { fallback.info.requester = info.requester || 'Fallback'; fallback.info.requesterId = info.requesterId; fallback._fallbackAttempted = true }
          state.currentTrack = fallback; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
          await playTrack(player, state, fallback.encoded)
          emitState(guildId)
          return
        }
      } catch {}
      await this._playNext(guildId, player, { failed: true })
    },

    // ── Controls ───────────────────────────────────────────────────────────
    async skip(guildId, { rotate = true } = {}) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) return false
      const state = getState(guildId)
      if (state.loop === 'track') state.loop = 'none'
      if (state.paused) { try { await player.setPaused(false) } catch {} }
      state.paused = false; state.lastPosition = 0; state.startedAt = null
      await this._playNext(guildId, player, { rotate })
      emitState(guildId)
      return true
    },

    async previous(guildId) {
      const state = getState(guildId)
      if (!state.history.length) return false
      const prev = state.history.shift()
      if (state.currentTrack) state.queue.unshift(state.currentTrack)
      state.queue.unshift(prev)
      await this.skip(guildId, { rotate: false })
      emitState(guildId)
      return true
    },

    async stop(guildId) {
      const player = client.shoukaku?.players?.get(guildId)
      const state  = getState(guildId)
      state.status = 'stopping'
      await Promise.allSettled([volumeWrites.get(guildId)].filter(Boolean))
      await panels.drain(guildId)
      await stopLiveUpdate(guildId)
      state.queue = []; state.currentTrack = null; state.loop = 'none'; state.history = []
      if (player) { await player.stopTrack(); await client.shoukaku.leaveVoiceChannel(guildId) }
      emitState(guildId)
      playerStates.delete(guildId)
      confirmedVolumes.delete(guildId)
      liveMessages.delete(guildId)
      try { require('../music/lyricsLive').stop(guildId, client) } catch {}
      try { await require('../music/setup').resetToIdle(client, guildId) } catch (error) { console.warn('[Music] Idle panel:', error.message) }
      emitState(guildId)
    },

    async pause(guildId) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) return
      const state      = getState(guildId)
      const nextPaused = !state.paused
      // player.position es un snapshot stale (Lavalink lo refresca cada ~5s);
      // la posición viva es Date.now() - startedAt, mantenida por el evento 'update'
      const position = nextPaused
        ? (state.startedAt ? Date.now() - state.startedAt : Number(player.position || 0))
        : Number(state.lastPosition || player.position || 0)
      await player.setPaused(nextPaused)
      state.paused = nextPaused
      if (nextPaused) state.lastPosition = position
      else state.startedAt = Date.now() - position
      emitState(guildId)
      return state.paused
    },

    async setVolume(guildId, vol) {
      const player = client.shoukaku?.players?.get(guildId)
      const state  = getState(guildId)
      if (state.status === 'stopping') throw new Error('El reproductor se está desconectando.')
      const v = Number(vol)
      if (!Number.isInteger(v) || v < 0 || v > 200) throw new Error('El volumen debe ser un entero entre 0 y 200.')
      if (!confirmedVolumes.has(guildId)) confirmedVolumes.set(guildId, state.volume ?? 100)
      state.volume = v
      emitState(guildId)
      const write = (volumeWrites.get(guildId) || Promise.resolve()).catch(() => {}).then(async () => {
        if (player) await player.setGlobalVolume(v)
        confirmedVolumes.set(guildId, v)
        return v
      })
      volumeWrites.set(guildId, write)
      try {
        return await write
      } catch (error) {
        if (volumeWrites.get(guildId) === write) state.volume = confirmedVolumes.get(guildId)
        throw error
      } finally {
        if (volumeWrites.get(guildId) === write) volumeWrites.delete(guildId)
        emitState(guildId)
        scheduleNpUpdate(client, guildId)
      }
    },

    // Toggle de modo shuffle: al activarlo mezcla la cola actual,
    // y _playNext seguirá tomando pistas al azar mientras esté activo
    async shuffle(guildId) {
      const state = getState(guildId)
      state.shuffle = !state.shuffle
      if (state.shuffle) {
        for (let i = state.queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]]
        }
      }
      emitState(guildId)
      return state.shuffle
    },

    setAutoplay(guildId, enabled = null) {
      const state = getState(guildId)
      state.autoplay = enabled === null ? !state.autoplay : Boolean(enabled)
      emitState(guildId)
      return state.autoplay
    },

    setLoop(guildId, mode) {
      const state = getState(guildId)
      state.loop = ['none', 'track', 'queue'].includes(mode) ? mode : 'none'
      emitState(guildId)
      return state.loop
    },

    setRadioMode(guildId, enabled = null) {
      const state = getState(guildId)
      state.radioMode = enabled === null ? !state.radioMode : Boolean(enabled)
      if (state.radioMode) state.autoplay = true
      emitState(guildId)
      return state.radioMode
    },

    removeDuplicates(guildId) {
      const state = getState(guildId), seen = new Set()
      const before = state.queue.length
      state.queue = state.queue.filter(track => {
        const info = track.info || track
        const key = info.uri || `${info.title}:${info.author}`
        if (seen.has(key)) return false
        seen.add(key); return true
      })
      emitState(guildId)
      scheduleNpUpdate(client, guildId)
      return before - state.queue.length
    },

    clearQueue(guildId) {
      const state = getState(guildId)
      const count = state.queue.length
      state.requestEpoch = (state.requestEpoch || 0) + 1
      state.queue = []
      emitState(guildId)
      scheduleNpUpdate(client, guildId)
      return count
    },

    async jump(guildId, position) {
      const state = getState(guildId)
      const idx = Number(position) - 1
      if (!Number.isInteger(idx) || idx < 0 || idx >= state.queue.length) throw new Error('Posición inválida.')
      const jumped = state.queue.splice(idx, 1)[0]
      if (state.currentTrack) state.queue.unshift(state.currentTrack)
      state.queue.unshift(jumped)
      await this.skip(guildId, { rotate: false })
      emitState(guildId)
    },

    async remove(guildId, position) {
      const state = getState(guildId)
      const idx = Number(position) - 1
      if (!Number.isInteger(idx) || idx < 0 || idx >= state.queue.length) throw new Error('Posición inválida.')
      const removed = state.queue.splice(idx, 1)[0]
      emitState(guildId)
      return removed
    },

    async move(guildId, from, to) {
      const state = getState(guildId)
      const f = Number(from) - 1, t2 = Number(to) - 1
      if (!Number.isInteger(f) || !Number.isInteger(t2) || f < 0 || f >= state.queue.length || t2 < 0 || t2 >= state.queue.length) throw new Error('Posición inválida.')
      const [track] = state.queue.splice(f, 1)
      state.queue.splice(t2, 0, track)
      emitState(guildId)
    },

    async seek(guildId, ms) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) throw new Error('No hay reproductor activo.')
      const state = getState(guildId)
      const len = state.currentTrack?.info?.length || state.currentTrack?.length || 0
      if (!Number.isFinite(ms) || ms < 0) throw new Error('Tiempo inválido.')
      if (state.currentTrack?.info?.isStream || !len) throw new Error('Esta pista no permite adelantar o retroceder.')
      const pos = Math.max(0, Math.min(len, ms))
      state.positionChangeAt = Date.now()
      await player.seekTo(pos)
      state.startedAt = Date.now() - pos; state.lastPosition = pos
      emitState(guildId)
    },

    async setFilter(guildId, preset) {
      if (!(preset in FILTER_PRESETS)) throw new Error(`Filtro desconocido: ${preset}`)
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) throw new Error('No hay reproductor activo.')
      const state = getState(guildId)
      if (preset === 'off' || FILTER_PRESETS[preset] === null) {
        await player.setFilters(FILTER_RESET)
        state.filter = 'off'
      } else {
        await player.setFilters({ ...FILTER_RESET, ...FILTER_PRESETS[preset] })
        state.filter = preset
      }
      emitState(guildId)
      return state.filter
    },

    async sendNowPlaying(guildId, track) {
      await stopLiveUpdate(guildId)
      const state = getState(guildId)
      if (!state.currentTrack || !state.textChannelId) return

      // El mensaje fijado del canal de peticiones muestra la pista y el progreso.
      const setup = require('../music/setup')
      const setupChId = setup.getChannelId(guildId)
      if (setupChId) {
        const sm = await setup.updatePanel(client, guildId, { embeds: [buildNPEmbed(client, guildId, state, 0)], components: buildControls(state) })
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

      const embed = buildNPEmbed(client, guildId, state, 0)
      const msg   = await channel.send({ embeds: [embed], components: buildControls(state) }).catch(() => null)
      if (msg) { liveMessages.set(guildId, { messageId: msg.id, channelId: channel.id }); startLiveUpdate(client, guildId) }
    },

    _bindPlayerEvents(player, guildId) {
      require('./player-events')(client, player, guildId, { emitState, elapsedForState, requestRecovery: scheduleRestore })
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
      await interaction.reply({ content: '❌ Debes estar en el mismo canal de voz que el bot.', ephemeral: true }).catch(() => {})
      return
    }
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {})

    if (cid.startsWith('mq_')) {
      const state = getState(guildId)
      if (cid === 'mq_close') { await interaction.deleteReply().catch(() => {}); return }
      const [, pageStr] = cid.split(':')
      const cur  = parseInt(pageStr) || 1
      const page = cid.startsWith('mq_next') ? cur + 1 : cur - 1
      const totalPages = Math.max(1, Math.ceil(state.queue.length / 10))
      await interaction.editReply({ embeds: [buildQueueEmbed(state, page)], components: buildQueueRows(page, totalPages) }).catch(() => {})
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
        interaction.followUp({ embeds: [buildQueueEmbed(state, 1)], components: buildQueueRows(1, totalPages), ephemeral: true }).catch(() => {})
        return
      }
      case 'mp_like': {
        if (!state.currentTrack) { interaction.followUp({ content: '❌ No hay música reproduciéndose.', ephemeral: true }).catch(() => {}); return }
        const res = await toggleLike(interaction.user.id, state.currentTrack)
        if (res) interaction.followUp({ embeds: [buildLikeEmbed(res)], ephemeral: true }).catch(() => {})
        return
      }
      case 'mp_lyrics': {
        const live = require('../music/lyricsLive')
        if (live.isActive(guildId)) {
          live.stop(guildId, client)
          interaction.followUp({ content: '🔇 Letras en vivo desactivadas.', ephemeral: true }).catch(() => {})
          return
        }
        const r = await live.start(client, guildId)
        if (r.ok) {
          interaction.followUp({ content: '🎤 Letras en vivo activadas — se sincronizan solas con la canción.', ephemeral: true }).catch(() => {})
        } else if (r.reason === 'no_sync' && r.plain) {
          interaction.followUp({ content: `🎤 Sin letras sincronizadas, aquí el texto:\n${r.plain.slice(0, 1800)}`, ephemeral: true }).catch(() => {})
        } else {
          interaction.followUp({ content: r.reason === 'no_track' ? '❌ No hay música reproduciéndose.' : '🔇 No encontré letras sincronizadas para esta canción.', ephemeral: true }).catch(() => {})
        }
        return
      }
    }
    scheduleNpUpdate(client, guildId)
    } catch (error) {
      console.warn(`[Music] Control failed (${guildId}):`, error.message)
      await interaction.followUp({ content: '❌ No se pudo aplicar el control. Inténtalo de nuevo.', ephemeral: true }).catch(() => {})
    }
  })

  for (const name of ['enqueue', 'setAudioParameter', 'joinChannel', '_playNext', '_recoverFailedTrack', 'skip', 'previous', 'stop', 'pause', 'shuffle', 'jump', 'remove', 'move', 'seek', 'setFilter']) {
    const operation = client.music[name]
    if (typeof operation !== 'function') continue
    client.music[name] = function (guildId, ...args) {
      return actions.run(guildId, () => operation.call(this, guildId, ...args))
    }
  }

  const sendNowPlaying = client.music.sendNowPlaying
  client.music.sendNowPlaying = function (guildId, ...args) {
    return panels.run(guildId, () => sendNowPlaying.call(this, guildId, ...args))
  }

  let restoring = false, restoreRetry = null
  function scheduleRestore() {
    if (restoreRetry || client._shuttingDown) return
    restoreRetry = setTimeout(() => { restoreRetry = null; restoreSessions() }, 5000)
    restoreRetry.unref?.()
  }
  async function restoreSessions() {
    if (!client._dbReady || client._shuttingDown) return
    if (restoring || !getNode()) { scheduleRestore(); return }
    restoring = true
    try {
      await sessions.drain()
      const rows = await sessions.list()
      for (const saved of rows) {
        if (!client.guilds?.cache?.has(saved.guildId) || !client.channels.cache.has(saved.voiceChannelId)) continue
        const existing = client.shoukaku.players.get(saved.guildId)
        if (existing && existing.node === getNode() && ['playing', 'paused'].includes(getState(saved.guildId).status) && !getState(saved.guildId).reconnectVoice) continue
        try {
          await actions.run(saved.guildId, async () => {
            const state = getState(saved.guildId)
            state.status = 'recovering'
            state.sessionId = saved.sessionId || state.sessionId
            state.revision = Math.max(state.revision, saved.revision || 0)
            const player = await client.music.joinChannel(saved.guildId, saved.voiceChannelId, saved.textChannelId)
            if (existing === player) {
              // A fresh Lavalink process also needs Discord's voice handshake, even when
              // the Shoukaku websocket has reconnected successfully.
              await player.update({ voice: player.data.playerOptions.voice })
            }
            Object.assign(state, {
              sessionId: state.sessionId, revision: state.revision,
              currentTrack: saved.currentTrack, customFilters: saved.customFilters,
              queue: saved.queue || [], history: saved.history || [], volume: saved.volume ?? 100,
              loop: saved.loop || 'none', autoplay: Boolean(saved.autoplay), shuffle: Boolean(saved.shuffle), radioMode: Boolean(saved.radioMode),
            })
            await player.setGlobalVolume(state.volume)
            const result = await client.music.search(saved.currentTrack.info?.uri || saved.currentTrack.uri, 'Recuperación')
            const track = result?.tracks?.find(track => track.encoded)
            if (!track) throw new Error('La pista guardada no está disponible')
            const savedInfo = saved.currentTrack.info || saved.currentTrack
            track.info.requester = savedInfo.requester
            track.info.requesterId = savedInfo.requesterId
            state.currentTrack = track
            state.status = 'loading'
            await playTrack(player, state, track.encoded, { position: saved.position || 0, paused: Boolean(saved.paused) })
            state.lastPosition = saved.position || 0
            state.paused = Boolean(saved.paused)
            state.startedAt = state.paused ? null : Date.now() - state.lastPosition
            state.status = state.paused ? 'paused' : 'playing'
            state.reconnectVoice = false
            if (saved.filter === 'custom' && saved.customFilters) { await player.setFilters(saved.customFilters); state.filter = 'custom' }
            else if (saved.filter && !['none', 'off'].includes(saved.filter)) await client.music.setFilter(saved.guildId, saved.filter)
            await client.music.sendNowPlaying(saved.guildId, track)
            emitState(saved.guildId)
            console.log(`[Music] Session restored: status=${state.status} volume=${state.volume} queue=${state.queue.length} position=${state.lastPosition}`)
          })
        } catch (error) {
          console.warn(`[Music] Session restore failed (${saved.guildId}):`, error.message)
          const state = getState(saved.guildId)
          Object.assign(state, { currentTrack: saved.currentTrack, queue: saved.queue || [], history: saved.history || [], volume: saved.volume ?? 100, paused: Boolean(saved.paused), lastPosition: saved.position || 0, startedAt: null, voiceChannelId: saved.voiceChannelId, textChannelId: saved.textChannelId, status: 'recovering' })
          emitState(saved.guildId)
          scheduleRestore()
        }
      }
    } catch (error) { console.error('[Music] Restore:', error.message) }
    finally { restoring = false }
  }
  client.music.restoreSessions = restoreSessions
  client.music.flushSessions = async () => {
    if (client._shuttingDown) { clearInterval(checkpoint); clearTimeout(restoreRetry) }
    await actions.drain()
    await Promise.allSettled([...volumeWrites.values()])
    await panels.drain()
    for (const [guildId, state] of playerStates) if (client._dbReady) await sessions.save(guildId, state)
    await sessions.drain()
  }
  const checkpoint = setInterval(() => {
    if (!client._dbReady) return
    for (const [guildId, state] of playerStates) if (state.currentTrack && state.status !== 'recovering') {
      sessions.save(guildId, state).catch(error => console.error('[Music] Checkpoint:', error.message))
    }
  }, 5000)
  checkpoint.unref?.()
  client.once('dbReady', async () => {
    await require('./setup').load(client)
    await restoreSessions()
    try {
      const rows = await require('./database').database.getAll247()
      for (const row of rows) {
        if (client.shoukaku.players.has(row.id)) continue
        const channel = client.channels.cache.get(row.channel247Id)
        if (channel?.guild) await client.music.joinChannel(row.id, row.channel247Id, row.text247Id || row.channel247Id)
      }
    } catch (error) { console.warn('[Music] 24/7 restore:', error.message) }
  })
  client.shoukaku.on?.('close', name => {
    for (const [guildId, player] of client.shoukaku.players) {
      if (player.node?.name !== name) continue
      const state = getState(guildId)
      state.lastPosition = elapsedForState(guildId, state)
      state.startedAt = null
      state.status = 'recovering'
      stopLiveUpdate(guildId)
      emitState(guildId)
    }
  })
  client.shoukaku.on?.('ready', () => restoreSessions())

  console.log('[Music] Sistema inicializado'.green)
}
