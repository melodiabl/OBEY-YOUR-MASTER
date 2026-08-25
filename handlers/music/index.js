const http = require('http')
const MusicHistory = require('../../database/schemas/MusicHistorySchema')

const { playerStates, liveMessages, liveTimers, getState, resetState } = require('./state')
const { normalizePublicTrack, tracksFromResolve, clampMs } = require('./utils')
const { FILTER_PRESETS, FILTER_RESET } = require('./filters')
const { buildNPEmbed, buildControls, buildQueueEmbed, buildQueueRows } = require('./embeds')
const { toggleLike, buildLikeEmbed } = require('./likes')
const { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate } = require('./liveupdate')

// Search priority: Spotify (PulseLink token) → YouTube Music → YouTube
const SEARCH_PREFIXES = ['spsearch', 'ytmsearch', 'ytsearch']

// SponsorBlock: segmentos a saltar automáticamente en tracks de YouTube
// (music_offtopic = partes sin música en videoclips; sponsor/selfpromo = anuncios)
const SPONSORBLOCK_CATEGORIES = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic']

module.exports = client => {
  if (!client.shoukaku) {
    console.warn('[Music] Shoukaku no inicializado'.yellow)
    return
  }

  function emitState(guildId) {
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
    if (player && state?.currentTrack && typeof player.volume === 'number') state.volume = player.volume
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
    if (!state?.currentTrack) return { active: false }
    const queueLimit = Math.max(1, Math.min(100, Number(options.queueLimit || 50)))
    const elapsed    = elapsedForState(guildId, state)
    const current    = normalizePublicTrack(state.currentTrack, { pos: 0, elapsed })
    const queue      = (state.queue || []).slice(0, queueLimit).map((t, i) => normalizePublicTrack(t, { pos: i + 1 }))
    return {
      active:         true,
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

    // ── Search via Lavalink: spsearch → ytmsearch → ytsearch ──────────────
    async search(query, requester) {
      const node  = getNode()
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      const rName = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown'
      const isUrl = /^https?:\/\//i.test(query) || /^(spotify|applemusic|deezer|soundcloud):/i.test(query)

      const identifiers = isUrl
        ? [query]
        : SEARCH_PREFIXES.map(p => `${p}:${query}`)

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
          // Spotify PREFERENTE (estilo Soundy): si hubo resultado de Spotify, va primero
          const merged = singleFallback ? [singleFallback.tracks[0], ...tracks] : tracks
          return { loadType: res.loadType, tracks: merged, playlistName: res.data?.info?.name || null }
        } catch {}
      }
      return singleFallback
    },

    // ── High-level play ────────────────────────────────────────────────────
    async play(guildId, voiceChannelId, textChannelId, query, requester) {
      const player = await this.joinChannel(guildId, voiceChannelId, textChannelId)
      const result = await this.search(query, requester)
      if (!result?.tracks?.length) return null
      const state = getState(guildId)
      const toAdd = result.loadType === 'playlist' ? result.tracks : [result.tracks[0]]
      for (const t of toAdd) state.queue.push(t)
      if (!state.currentTrack) {
        await this._playNext(guildId, player)
      } else {
        emitState(guildId)
        const live = liveMessages.get(guildId)
        if (live) {
          const ch = client.channels.cache.get(live.channelId)
          if (ch) ch.messages.fetch(live.messageId).then(msg => {
            if (!msg) return
            const pos = client.shoukaku?.players?.get(guildId)?.position ?? null
            msg.edit({ embeds: [buildNPEmbed(client, guildId, state, pos)], components: buildControls(state) }).catch(() => {})
          }).catch(() => {})
        }
      }
      return { result, state }
    },

    // ── Join voice channel ─────────────────────────────────────────────────
    async joinChannel(guildId, voiceChannelId, textChannelId) {
      const existing = client.shoukaku?.players?.get(guildId)
      if (existing && existing.node?.ws?.readyState === 1) return existing
      if (existing) {
        try { await client.shoukaku.leaveVoiceChannel(guildId) } catch {}
        const s = getState(guildId)
        s.currentTrack = null; s.startedAt = null; s.paused = false
        stopLiveUpdate(guildId)
      }
      const node = getNode()
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      const player = await client.shoukaku.joinVoiceChannel({ guildId, channelId: voiceChannelId, shardId: 0 })
      const state  = getState(guildId)
      state.voiceChannelId = voiceChannelId
      state.textChannelId  = textChannelId
      this._bindPlayerEvents(player, guildId)
      applySponsorBlock(player, guildId)
      return player
    },

    // ── Play next in queue ─────────────────────────────────────────────────
    async _playNext(guildId, player) {
      const state = getState(guildId)
      if (!player) player = client.shoukaku?.players?.get(guildId)
      if (!player) return

      if (state.loop === 'track' && state.currentTrack?.encoded) {
        state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
        await player.playTrack({ track: { encoded: state.currentTrack.encoded } })
        emitState(guildId)
        return
      }

      if (state.loop === 'queue' && state.currentTrack) state.queue.push(state.currentTrack)

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
              `ytmsearch:${seed.author || seed.title}`,
              `ytmsearch:${seed.title} ${seed.author || ''} mix`,
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
              await player.playTrack({ track: { encoded: pick.encoded } })
              emitState(guildId)
              return
            }
            console.warn(`[Music] Autoplay sin candidatos para "${seed.title}" (${guildId})`)
          } catch (e) {
            console.error('[Music] Autoplay error:', e?.message || e)
          }
        }

        state.currentTrack = null; state.startedAt = null; state.lastPosition = 0; state.paused = false
        stopLiveUpdate(guildId)
        await player.stopTrack()
        try { require('../music/lyricsLive').stop(guildId, client) } catch {}
        try { require('../music/setup').resetToIdle(client, guildId) } catch {}
        emitState(guildId)
        return
      }

      // Resolución lazy: tracks de playlists guardadas vienen sin encoded
      if (!next.encoded) {
        const info = next.info || next
        const q    = info.uri || `${info.title || ''} ${info.author || ''}`.trim()
        const resolved = q ? await this.search(q, info.requester || 'Playlist').catch(() => null) : null
        const real = resolved?.tracks?.find(t => t.encoded)
        if (!real) return this._playNext(guildId, player) // irrecuperable → siguiente
        if (real.info) real.info.requester = info.requester || real.info.requester
        next = real
      }

      if (state.currentTrack) { state.history.unshift(state.currentTrack); if (state.history.length > 10) state.history.pop() }
      state.currentTrack = next; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
      rememberTrack(guildId, next)
      await player.playTrack({ track: { encoded: next.encoded } })
      emitState(guildId)
    },

    async _recoverFailedTrack(guildId, player, errorMessage) {
      const state  = getState(guildId)
      const failed = state.currentTrack
      if (!failed || failed._fallbackAttempted) { await this._playNext(guildId, player); return }
      failed._fallbackAttempted = true
      const info = failed.info || failed
      try {
        const node = getNode()
        const res  = await node.rest.resolve(`ytsearch:${info.title || ''} ${info.author || ''}`)
        const fallback = tracksFromResolve(res).find(t => t.encoded && t.info?.uri !== info.uri)
        if (fallback) {
          if (fallback.info) { fallback.info.requester = info.requester || 'Fallback'; fallback._fallbackAttempted = true }
          state.currentTrack = fallback; state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
          await player.playTrack({ track: { encoded: fallback.encoded } })
          emitState(guildId)
          return
        }
      } catch {}
      await this._playNext(guildId, player)
    },

    // ── Controls ───────────────────────────────────────────────────────────
    async skip(guildId) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) return false
      const state = getState(guildId)
      if (state.loop === 'track') state.loop = 'none'
      if (state.paused) { try { await player.setPaused(false) } catch {} }
      state.paused = false; state.lastPosition = 0; state.startedAt = null
      await this._playNext(guildId, player)
      emitState(guildId)
      return true
    },

    async previous(guildId) {
      const state = getState(guildId)
      if (!state.history.length) return false
      const prev = state.history.shift()
      if (state.currentTrack) state.queue.unshift(state.currentTrack)
      state.queue.unshift(prev)
      await this.skip(guildId)
      emitState(guildId)
      return true
    },

    async stop(guildId) {
      const player = client.shoukaku?.players?.get(guildId)
      const state  = getState(guildId)
      stopLiveUpdate(guildId)
      state.queue = []; state.currentTrack = null; state.loop = 'none'; state.history = []
      if (player) { await player.stopTrack(); await client.shoukaku.leaveVoiceChannel(guildId) }
      playerStates.delete(guildId)
      liveMessages.delete(guildId)
      try { require('../music/lyricsLive').stop(guildId, client) } catch {}
      try { require('../music/setup').resetToIdle(client, guildId) } catch {}
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
      const v = Math.max(0, Math.min(200, vol))
      state.volume = v
      if (player) await player.setGlobalVolume(v)
      emitState(guildId)
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

    async jump(guildId, position) {
      const state = getState(guildId)
      const idx = Number(position) - 1
      if (idx < 0 || idx >= state.queue.length) throw new Error('Posición inválida.')
      const jumped = state.queue.splice(idx, 1)[0]
      if (state.currentTrack) state.queue.unshift(state.currentTrack)
      state.queue.unshift(jumped)
      await this.skip(guildId)
      emitState(guildId)
    },

    async remove(guildId, position) {
      const state = getState(guildId)
      const idx = Number(position) - 1
      if (idx < 0 || idx >= state.queue.length) throw new Error('Posición inválida.')
      const removed = state.queue.splice(idx, 1)[0]
      emitState(guildId)
      return removed
    },

    async move(guildId, from, to) {
      const state = getState(guildId)
      const f = Number(from) - 1, t2 = Number(to) - 1
      if (f < 0 || f >= state.queue.length || t2 < 0 || t2 >= state.queue.length) throw new Error('Posición inválida.')
      const [track] = state.queue.splice(f, 1)
      state.queue.splice(t2, 0, track)
      emitState(guildId)
    },

    async seek(guildId, ms) {
      const player = client.shoukaku?.players?.get(guildId)
      if (!player) throw new Error('No hay reproductor activo.')
      const state = getState(guildId)
      const len = state.currentTrack?.info?.length || state.currentTrack?.length || 0
      const pos = Math.max(0, Math.min(len, ms))
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
        await player.setFilters(FILTER_PRESETS[preset])
        state.filter = preset
      }
      emitState(guildId)
      return state.filter
    },

    async sendNowPlaying(guildId, track) {
      const state = getState(guildId)
      if (!state.textChannelId) return

      // Si el guild tiene canal de peticiones (Setup), el panel ÚNICO actúa de reproductor
      const setup = require('../music/setup')
      const setupChId = setup.getChannelId(guildId)
      const setupMsgId = setup.getMessageId(guildId)
      if (setupChId && setupMsgId) {
        const sch = client.channels.cache.get(setupChId)
        const sm  = sch && await sch.messages.fetch(setupMsgId).catch(() => null)
        if (sm) {
          const old = liveMessages.get(guildId)
          if (old && old.messageId !== sm.id) {
            const oc = client.channels.cache.get(old.channelId)
            oc?.messages.fetch(old.messageId).then(m => m.delete().catch(() => {})).catch(() => {})
          }
          await sm.edit({ embeds: [buildNPEmbed(client, guildId, state, 0)], components: buildControls(state) }).catch(() => {})
          liveMessages.set(guildId, { messageId: sm.id, channelId: sch.id, isSetup: true })
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
      player.on('end', async data => {
        if (['replaced', 'stopped'].includes(data?.reason)) return
        if (data?.reason === 'loadFailed') {
          try { await this._recoverFailedTrack(guildId, player, 'loadFailed') } catch {}
          return
        }
        try { await this._playNext(guildId, player) } catch {}
      })
      player.on('start', async () => {
        const state = getState(guildId)
        state.startedAt = Date.now(); state.lastPosition = 0; state.paused = false
        if (state.currentTrack) await this.sendNowPlaying(guildId, state.currentTrack)
        emitState(guildId)
      })
      player.on('update', data => {
        const state    = playerStates.get(guildId)
        const position = Number(data?.state?.position)
        if (!state?.currentTrack || !Number.isFinite(position)) return
        state.lastPosition = position
        if (!state.paused) state.startedAt = Date.now() - position
      })
      player.on('exception', async data => {
        console.error('[Music] Exception:', data?.exception?.message || data)
        try { await this._recoverFailedTrack(guildId, player, data?.exception?.message) } catch (e) {
          console.error('[Music] Recovery failed:', e?.message || e)
        }
      })
      player.on('closed', () => {
        stopLiveUpdate(guildId)
        playerStates.delete(guildId)
        liveMessages.delete(guildId)
        emitState(guildId)
      })
    },
  }

  // ── Button handler ─────────────────────────────────────────────────────────
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    const cid = interaction.customId
    if (!cid.startsWith('mp_') && !cid.startsWith('mq_')) return
    const guildId = interaction.guild?.id
    if (!guildId || !client.music) return
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
    switch (action) {
      case 'mp_toggle':   client.music.pause(guildId).catch(() => {}); break
      case 'mp_skip':     client.music.skip(guildId).catch(() => {}); break
      case 'mp_stop':   { client.music.stop(guildId).catch(() => {}); return }
      case 'mp_shuffle':  client.music.shuffle(guildId).catch(() => {}); break
      case 'mp_prev':     client.music.previous(guildId).catch(() => {}); break
      case 'mp_autoplay': client.music.setAutoplay(guildId); break
      case 'mp_loop': {
        const next = state.loop === 'none' ? 'track' : state.loop === 'track' ? 'queue' : 'none'
        client.music.setLoop(guildId, next); break
      }
      case 'mp_voldown': client.music.setVolume(guildId, Math.max(0,   state.volume - 10)).catch(() => {}); break
      case 'mp_volup':   client.music.setVolume(guildId, Math.min(200, state.volume + 10)).catch(() => {}); break
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
  })

  // Cargar canales de peticiones (Setup v2) cuando el bot esté listo y la DB conectada
  client.once('ready', () => setTimeout(() => { try { require('../music/setup').load(client) } catch {} }, 4000))

  // Reconectar a los canales con modo 24/7 activo tras un reinicio
  client.once('ready', () => setTimeout(async () => {
    try {
      const { database } = require('../music/database')
      const rows = await database.getAll247()
      for (const r of rows) {
        const ch = client.channels.cache.get(r.channel247Id)
        if (!ch || !ch.guild || ch.members?.filter(m => !m.user.bot).size === 0) continue
        try { await client.music.joinChannel(r.id, r.channel247Id, r.text247Id || r.channel247Id) } catch {}
      }
      if (rows.length) console.log(`[Music] 24/7 reconectado en ${rows.length} servidor(es)`.green)
    } catch (e) { console.warn('[Music] 24/7 reconnect error:', e?.message || e) }
  }, 7000))

  console.log('[Music] Sistema inicializado'.green)
}
