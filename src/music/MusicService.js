const crypto = require('node:crypto')

const MUSIC_ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  NO_ACTIVE_QUEUE: 'NO_ACTIVE_QUEUE',
  WRONG_VOICE_CHANNEL: 'WRONG_VOICE_CHANNEL',
  NOT_PLAYING: 'NOT_PLAYING',
  NOT_PAUSED: 'NOT_PAUSED',
  ALREADY_PAUSED: 'ALREADY_PAUSED',
  NO_RESULTS: 'NO_RESULTS'
}

class MusicError extends Error {
  constructor (code, message) {
    super(message)
    this.name = 'MusicError'
    this.code = code
  }
}

class PlayerState {
  constructor ({ guildId }) {
    this.guildId = guildId

    this.status = 'STOPPED' // STOPPED | PLAYING | PAUSED
    this.voiceChannelId = null
    this.textChannelId = null

    this.currentTrack = null
    this.queue = []
    this.loop = 'none' // none | track | queue
    this.volume = 100

    this.createdAt = Date.now()
    this.updatedAt = Date.now()
  }

  get isPlaying () {
    return this.status === 'PLAYING'
  }

  get isPaused () {
    return this.status === 'PAUSED'
  }

  get isStopped () {
    return this.status === 'STOPPED'
  }
}

class QueueManager {
  assertSameVoice (state, voiceChannelId) {
    if (!voiceChannelId) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'voiceChannelId requerido.')
    if (!state.voiceChannelId) return
    if (state.voiceChannelId !== voiceChannelId && !state.isStopped) {
      throw new MusicError(MUSIC_ERROR_CODES.WRONG_VOICE_CHANNEL, 'Debes estar en el mismo canal de voz que el bot.')
    }
  }

  enqueue (state, track) {
    if (!state.currentTrack) {
      state.currentTrack = track
      state.status = 'PLAYING'
      return { started: true, track }
    }

    state.queue.push(track)
    return { started: false, track, position: state.queue.length }
  }

  pause (state) {
    if (!state.currentTrack) throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música reproduciéndose.')
    if (state.isPaused) throw new MusicError(MUSIC_ERROR_CODES.ALREADY_PAUSED, 'La música ya está pausada.')
    state.status = 'PAUSED'
  }

  resume (state) {
    if (!state.currentTrack) throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música para reanudar.')
    if (!state.isPaused) throw new MusicError(MUSIC_ERROR_CODES.NOT_PAUSED, 'La música no está pausada.')
    state.status = 'PLAYING'
  }

  stop (state) {
    state.currentTrack = null
    state.queue = []
    state.status = 'STOPPED'
    state.voiceChannelId = null
  }

  skip (state, force = false) {
    if (!state.currentTrack) {
      return { skippedTo: null, ended: true }
    }

    const wasPaused = state.isPaused
    const current = state.currentTrack

    if (state.loop === 'track' && !force) {
      // Si es loop de track y no es forzado (evento end), simplemente retornamos el mismo track
      return { skippedTo: current, ended: false }
    }

    if (state.loop === 'queue') {
      state.queue.push(current)
    }

    const next = state.queue.shift() || null
    if (!next) {
      state.currentTrack = null
      state.status = 'STOPPED'
      state.voiceChannelId = null
      return { skippedTo: null, ended: true }
    }

    state.currentTrack = next
    state.status = wasPaused ? 'PAUSED' : 'PLAYING'
    return { skippedTo: next, ended: false }
  }

  shuffle (state) {
    if (state.queue.length < 2) return state.queue.length
    for (let i = state.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]]
    }
    return state.queue.length
  }

  clearUpcoming (state) {
    const cleared = state.queue.length
    state.queue = []
    return cleared
  }
}

function makeId () {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return crypto.randomBytes(16).toString('hex')
}

function normalizeRequestedBy (requestedBy) {
  if (!requestedBy) return null
  const id = requestedBy.id || requestedBy.userId || null
  const tag = requestedBy.tag || requestedBy.username || null
  return { id: id ? String(id) : null, tag: tag ? String(tag) : null }
}

class PlayerStateStore {
  constructor (options = {}) {
    this._states = new Map()
    this._locks = new Map()
    this._idleTimers = new Map()
    this._idleTtlMs = Math.max(60_000, Number(options.idleTtlMs || 0) || 0)
  }

  getOrCreate (guildId) {
    const id = String(guildId || '').trim()
    if (!id) throw new Error('guildId requerido.')
    const existing = this._states.get(id)
    if (existing) return existing

    const state = new PlayerState({ guildId: id })
    this._states.set(id, state)
    return state
  }

  touch (state) {
    state.updatedAt = Date.now()
  }

  snapshot (state) {
    return {
      guildId: state.guildId,
      status: state.status,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      voiceChannelId: state.voiceChannelId,
      textChannelId: state.textChannelId,
      currentTrack: state.currentTrack,
      queue: state.queue.slice(),
      loop: state.loop,
      volume: state.volume,
      updatedAt: state.updatedAt
    }
  }

  async withGuildLock (guildId, fn) {
    const id = String(guildId || '').trim()
    const prev = this._locks.get(id) || Promise.resolve()
    const run = prev
      .catch(() => {})
      .then(() => fn())
    this._locks.set(id, run.finally(() => {
      if (this._locks.get(id) === run) this._locks.delete(id)
    }))
    return await run
  }

  maybeScheduleDispose (state) {
    if (!state.isStopped) return
    const guildId = state.guildId
    const existing = this._idleTimers.get(guildId)
    if (existing) clearTimeout(existing)

    const t = setTimeout(() => {
      try {
        const s = this._states.get(guildId)
        if (s && s.isStopped) this._states.delete(guildId)
      } catch {}
      this._idleTimers.delete(guildId)
    }, this._idleTtlMs)

    this._idleTimers.set(guildId, t)
  }
}

class MusicService {
  constructor (shoukaku, options = {}) {
    this.shoukaku = shoukaku
    this._store = new PlayerStateStore({
      idleTtlMs: options.idleTtlMs ?? 5 * 60 * 1000
    })
    this._queues = new QueueManager()
  }

  /**
   * @private
   * Resuelve la consulta del usuario a un identificador que Lavalink puede entender.
   * Versión simplificada para soportar únicamente YouTube.
   * @param {string} query
   * @returns {{identifier: string, collectionType: 'playlist'|null}}
   */
  _resolveQueryToIdentifier (query) {
    const q = String(query || '').trim()
    if (!q) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'La consulta no puede estar vacía.')

    const urlRegex = /^https?:\/\//

    // Si es una URL, la usamos directamente (asumiendo que es de YouTube/YouTube Music)
    if (urlRegex.test(q)) {
      console.log(`[Music] Detectada URL directa. Usando tal cual: ${q}`)
      const isPlaylist = q.includes('list=') || q.includes('youtube.com/playlist/')
      return { identifier: q, collectionType: isPlaylist ? 'playlist' : null }
    }

    // Si no es una URL, es una búsqueda de texto en YouTube.
    const identifier = `ytsearch:${q}`
    console.log(`[Music] Detectada búsqueda de texto. Identificador para Lavalink: "${identifier}"`)
    return { identifier, collectionType: null }
  }

  _getCollectionTypeFromIdentifier (identifier) {
    const q = String(identifier || '').toLowerCase()
    if (q.includes('list=') || q.includes('youtube.com/playlist/')) return 'playlist'
    return null // Ya no hay álbumes de otras fuentes
  }

  async _applyPlayerVolume (player, volume) {
    if (!player) return
    const vol = Math.max(0, Math.min(1000, Number(volume)))
    if (typeof player.setGlobalVolume === 'function') return await player.setGlobalVolume(vol)
    if (typeof player.setVolume === 'function') return await player.setVolume(vol)
    if (typeof player.update === 'function') return await player.update({ volume: vol })
  }

  async _getOrCreatePlayer (guildId, voiceChannelId) {
    let player = this.shoukaku.players.get(guildId)
    if (player) return player

    const node = this.shoukaku.options.nodeResolver(this.shoukaku.nodes)
    if (!node) throw new Error('No hay nodos de Lavalink disponibles.')

    player = await this.shoukaku.joinVoiceChannel({
      guildId,
      channelId: voiceChannelId,
      shardId: 0 // Ajustar si usas sharding
    })

    try {
      const state = this._store.getOrCreate(guildId)
      await this._applyPlayerVolume(player, state.volume)
    } catch {}

    player.on('start', () => {
      const state = this._store.getOrCreate(guildId)
      state.status = 'PLAYING'
    })

    player.on('end', async (data) => {
      if (data.reason === 'REPLACED') return
      try {
        const state = this._store.getOrCreate(guildId)
        if (!state.currentTrack) return
        await this.skip({ guildId, voiceChannelId: state.voiceChannelId || voiceChannelId })
      } catch (e) {
        console.error(`[Music] Error automatically skipping track (${guildId}):`, e)
      }
    })

    player.on('error', (error) => {
      console.error(`Player Error (${guildId}):`, error)
    })

    return player
  }

  async play ({ guildId, voiceChannelId, textChannelId, requestedBy, query }) {
    if (!guildId) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'guildId requerido.')
    if (!voiceChannelId) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'voiceChannelId requerido.')

    const node = this.shoukaku.options.nodeResolver(this.shoukaku.nodes)
    if (!node) throw new Error('Lavalink no está conectado o no hay nodos disponibles.')

    // LÓGICA CENTRAL REFACTORIZADA
    const { identifier, collectionType } = this._resolveQueryToIdentifier(query)
    console.log(`[Music] Petición a Lavalink con identificador: "${identifier}"`)
    const result = await node.rest.resolve(identifier)

    // Normalizar respuesta de Lavalink
    let tracks = []
    let loadType = result?.loadType || 'UNKNOWN'
    // Soporte para Lavalink v3 (loadType en minúscula) y v4 (loadType en mayúscula)
    if (['TRACK_LOADED', 'track'].includes(loadType)) {
      tracks = result.tracks || (result.data ? [result.data] : [])
    } else if (['PLAYLIST_LOADED', 'playlist'].includes(loadType)) {
      tracks = result.tracks || result.data?.tracks || []
    } else if (['SEARCH_RESULT', 'search'].includes(loadType)) {
      tracks = result.tracks || result.data || []
    }

    console.log(`[Music] Respuesta de Lavalink. LoadType: "${loadType}", Tracks Encontrados: ${tracks?.length || 0}`)

    if (['LOAD_FAILED', 'load_failed', 'error'].includes(loadType)) {
      const error = result?.data || result?.exception
      const message = error?.message || 'Error desconocido.'
      const cause = error?.cause || 'Sin causa especificada.'
      console.error(`[Music] Lavalink LOAD_FAILED. Identificador: "${identifier}". Motivo: ${message}`, error)
      const hint = identifier.startsWith('sp') ? ' (Asegúrate de que tus credenciales de Spotify son correctas y Lavalink se reinició)' : ''
      throw new MusicError(MUSIC_ERROR_CODES.NO_RESULTS, `No se pudo cargar la pista.${hint} | Causa: ${cause}`)
    }

    if (!tracks || !tracks.length) {
      throw new MusicError(MUSIC_ERROR_CODES.NO_RESULTS, 'No se encontraron resultados para tu búsqueda.')
    }

    const isPlaylist = ['PLAYLIST_LOADED', 'playlist'].includes(loadType)
    const tracksToEnqueue = isPlaylist ? tracks : [tracks[0]]
    const playlistName = isPlaylist ? (result.data?.info?.name || null) : null

    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      state.voiceChannelId = voiceChannelId
      state.textChannelId = textChannelId || state.textChannelId

      let firstRes = null
      for (const lavalinkTrack of tracksToEnqueue) {
        // Normalizar track para v3/v4
        const encoded = lavalinkTrack.encoded || lavalinkTrack.track
        const info = lavalinkTrack.info || {}
        const uri = info.uri || info.url || null
        const thumbnail = info.artworkUrl || (info.sourceName === 'youtube' ? `https://img.youtube.com/vi/${info.identifier}/mqdefault.jpg` : null)

        const track = {
          id: makeId(),
          title: info.title || 'Sin titulo',
          author: info.author || 'Desconocido',
          uri: uri || identifier,
          thumbnail,
          duration: info.length ?? info.duration ?? 0,
          lavalinkTrack: encoded,
          requestedBy: normalizeRequestedBy(requestedBy)
        }

        const res = this._queues.enqueue(state, track)
        if (!firstRes) firstRes = res
      }

      const player = await this._getOrCreatePlayer(guildId, voiceChannelId)

      if (firstRes.started) {
        await this._applyPlayerVolume(player, state.volume)
        await player.playTrack({ track: { encoded: firstRes.track.lavalinkTrack } })
      }

      this._store.touch(state)
      return {
        ...firstRes,
        isPlaylist,
        playlistName,
        collectionType: isPlaylist ? (collectionType || this._getCollectionTypeFromIdentifier(identifier)) : null,
        trackCount: tracksToEnqueue.length,
        state: this._store.snapshot(state)
      }
    })
  }

  async pause ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.pause(state)

      const player = this.shoukaku.players.get(guildId)
      if (player) await player.setPaused(true)

      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async resume ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.resume(state)

      const player = this.shoukaku.players.get(guildId)
      if (player) await player.setPaused(false)

      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async stop ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.stop(state)

      const player = this.shoukaku.players.get(guildId)
      if (player) {
        await player.stopTrack()
        await this.shoukaku.leaveVoiceChannel(guildId)
      }

      this._store.touch(state)
      this._store.maybeScheduleDispose(state)
      return this._store.snapshot(state)
    })
  }

  async skip ({ guildId, voiceChannelId, force = false }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      if (force) this._queues.assertSameVoice(state, voiceChannelId)
      const res = this._queues.skip(state, force)

      const player = this.shoukaku.players.get(guildId)
      if (res.ended) {
        if (player) {
          await player.stopTrack()
          await this.shoukaku.leaveVoiceChannel(guildId)
        }
      } else if (player) {
        await player.playTrack({ track: { encoded: state.currentTrack.lavalinkTrack } })
      }

      this._store.touch(state)
      this._store.maybeScheduleDispose(state)
      return { ...res, state: this._store.snapshot(state) }
    })
  }

  async getQueue ({ guildId } = {}) {
    const state = this._store.getOrCreate(guildId)
    return this._store.snapshot(state)
  }

  async nowPlaying ({ guildId }) {
    const state = this._store.getOrCreate(guildId)
    return this._store.snapshot(state)
  }

  async clearQueue ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      const cleared = this._queues.clearUpcoming(state)
      this._store.touch(state)
      return { cleared, state: this._store.snapshot(state) }
    })
  }

  async setVolume ({ guildId, voiceChannelId, volume }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)

      const vol = Math.max(0, Math.min(1000, volume))
      state.volume = vol

      const player = this.shoukaku.players.get(guildId)
      await this._applyPlayerVolume(player, vol)

      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async setLoop ({ guildId, voiceChannelId, mode }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)

      if (!['none', 'track', 'queue'].includes(mode)) {
        throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'Modo de loop inválido.')
      }

      state.loop = mode
      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async shuffle ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)

      const count = this._queues.shuffle(state)
      this._store.touch(state)
      return { count, state: this._store.snapshot(state) }
    })
  }

  async seek ({ guildId, voiceChannelId, position }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)

      if (!state.currentTrack) throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música reproduciéndose.')

      const player = this.shoukaku.players.get(guildId)
      if (player) await player.seekTo(position)

      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }
}

module.exports = {
  MusicService,
  QueueManager,
  PlayerState,
  PlayerStateStore,
  MusicError,
  MUSIC_ERROR_CODES
}
