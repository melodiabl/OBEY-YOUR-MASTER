const crypto = require('node:crypto')
const { Readable } = require('node:stream')

let voice = null
try {
  // eslint-disable-next-line n/no-missing-require
  voice = require('@discordjs/voice')
} catch {}

const MUSIC_ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  NO_ACTIVE_QUEUE: 'NO_ACTIVE_QUEUE',
  WRONG_VOICE_CHANNEL: 'WRONG_VOICE_CHANNEL',
  NOT_PLAYING: 'NOT_PLAYING',
  NOT_PAUSED: 'NOT_PAUSED',
  ALREADY_PAUSED: 'ALREADY_PAUSED'
}

class MusicError extends Error {
  constructor (code, message) {
    super(message)
    this.name = 'MusicError'
    this.code = code
  }
}

class AudioProvider {
  constructor () {
    if (new.target === AudioProvider) throw new Error('AudioProvider es una interfaz.')
  }

  async resolve () {
    throw new Error('Not implemented')
  }

  async getStream () {
    throw new Error('Not implemented')
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
    if (!state.isPlaying) throw new MusicError(MUSIC_ERROR_CODES.NOT_PLAYING, 'No hay música reproduciéndose.')
    state.status = 'PAUSED'
  }

  resume (state) {
    if (!state.currentTrack) throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música para reanudar.')
    if (!state.isPaused) throw new MusicError(MUSIC_ERROR_CODES.NOT_PAUSED, 'La música no está pausada.')
    state.status = 'PLAYING'
  }

  stop (state) {
    if (!state.currentTrack && state.queue.length === 0) {
      throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música reproduciéndose.')
    }
    state.currentTrack = null
    state.queue = []
    state.status = 'STOPPED'
    state.voiceChannelId = null
  }

  skip (state) {
    if (!state.currentTrack) throw new MusicError(MUSIC_ERROR_CODES.NO_ACTIVE_QUEUE, 'No hay música reproduciéndose.')

    const wasPaused = state.isPaused
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

  clearUpcoming (state) {
    const cleared = state.queue.length
    state.queue = []
    if (!state.currentTrack) {
      state.status = 'STOPPED'
      state.voiceChannelId = null
    }
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

function makeTrackFromQuery ({ guildId, query, requestedBy }) {
  const q = String(query || '').trim()
  return {
    id: makeId(),
    guildId: String(guildId),
    title: q,
    query: q,
    requestedBy: normalizeRequestedBy(requestedBy),
    addedAt: Date.now()
  }
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
    if (state.currentTrack) return
    if (state.queue.length) return

    const guildId = state.guildId
    const existing = this._idleTimers.get(guildId)
    if (existing) clearTimeout(existing)

    const t = setTimeout(() => {
      try {
        const s = this._states.get(guildId)
        if (!s) return
        if (!s.isStopped) return
        if (s.currentTrack) return
        if (s.queue.length) return
        this._states.delete(guildId)
      } catch {}
      this._idleTimers.delete(guildId)
    }, this._idleTtlMs)

    this._idleTimers.set(guildId, t)
  }
}

class MusicService {
  constructor (options = {}) {
    this._store = new PlayerStateStore({
      idleTtlMs: options.idleTtlMs ?? 30 * 60 * 1000
    })
    this._queues = new QueueManager()
    this._voice = new Map() // guildId -> { connection, player, stream }
  }

  _ensureVoiceLib () {
    if (!voice) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'Voz no disponible: instala @discordjs/voice.')
  }

  _getGuildVoice (guildId) {
    return this._voice.get(String(guildId)) || null
  }

  _createSilencePcmStream () {
    // 48kHz stereo s16le, 20ms frames => 960 samples/frame/channel => 3840 bytes/frame.
    const frame = Buffer.alloc(960 * 2 * 2)
    const stream = new Readable({ read () {} })

    const timer = setInterval(() => {
      try {
        stream.push(frame)
      } catch {}
    }, 20)
    timer.unref?.()

    const cleanup = () => {
      try { clearInterval(timer) } catch {}
    }
    stream.on('close', cleanup)
    stream.on('end', cleanup)
    stream.on('error', cleanup)

    return stream
  }

  async _connectToVoice ({ guild, voiceChannelId }) {
    this._ensureVoiceLib()

    if (!guild?.id || !guild?.voiceAdapterCreator) {
      throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'guild requerido para conectar a voz.')
    }

    const guildId = String(guild.id)
    const existing = this._getGuildVoice(guildId)
    if (existing?.connection && existing?.player) return existing

    const connection = voice.joinVoiceChannel({
      channelId: voiceChannelId,
      guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true
    })

    try {
      await voice.entersState(connection, voice.VoiceConnectionStatus.Ready, 20_000)
    } catch (e) {
      try { connection.destroy() } catch {}
      throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'No pude conectar al canal de voz.')
    }

    const player = voice.createAudioPlayer({
      behaviors: {
        noSubscriber: voice.NoSubscriberBehavior.Pause
      }
    })

    connection.subscribe(player)

    const holder = { connection, player, stream: null }
    this._voice.set(guildId, holder)
    return holder
  }

  _stopVoice (guildId) {
    const id = String(guildId)
    const holder = this._voice.get(id)
    if (!holder) return

    try { holder.player?.stop?.(true) } catch {}
    try { holder.stream?.destroy?.() } catch {}
    try { holder.connection?.destroy?.() } catch {}
    this._voice.delete(id)
  }

  _playSilence (guildId) {
    this._ensureVoiceLib()
    const holder = this._getGuildVoice(guildId)
    if (!holder?.player) return false

    try { holder.stream?.destroy?.() } catch {}
    const stream = this._createSilencePcmStream()

    const resource = voice.createAudioResource(stream, {
      inputType: voice.StreamType.Raw,
      inlineVolume: false
    })

    holder.stream = stream
    holder.player.play(resource)
    return true
  }

  getState (guildId) {
    return this._store.getOrCreate(guildId)
  }

  snapshot (guildId) {
    const state = this._store.getOrCreate(guildId)
    return this._store.snapshot(state)
  }

  async play ({ guildId, guild = null, voiceChannelId, textChannelId, requestedBy, query }) {
    if (!guildId) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'guildId requerido.')
    if (!voiceChannelId) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'voiceChannelId requerido.')
    const q = String(query || '').trim()
    if (!q) throw new MusicError(MUSIC_ERROR_CODES.BAD_REQUEST, 'Debes proporcionar una búsqueda o enlace.')

    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)

      if (state.voiceChannelId && state.voiceChannelId !== voiceChannelId && !state.isStopped) {
        throw new MusicError(MUSIC_ERROR_CODES.WRONG_VOICE_CHANNEL, 'Ya hay música “activa” en otro canal de voz de este servidor.')
      }

      state.voiceChannelId = voiceChannelId
      state.textChannelId = textChannelId || state.textChannelId || null

      const track = makeTrackFromQuery({ guildId, query: q, requestedBy })
      const res = this._queues.enqueue(state, track)
      this._store.touch(state)

      if (res.started) {
        await this._connectToVoice({ guild, voiceChannelId })
        this._playSilence(guildId)
      }

      return { ...res, state: this._store.snapshot(state) }
    })
  }

  async pause ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.pause(state)
      try {
        this._ensureVoiceLib()
        const holder = this._getGuildVoice(guildId)
        holder?.player?.pause?.(true)
      } catch {}
      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async resume ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.resume(state)
      try {
        this._ensureVoiceLib()
        const holder = this._getGuildVoice(guildId)
        holder?.player?.unpause?.()
      } catch {}
      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async stop ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._queues.stop(state)
      this._stopVoice(guildId)
      this._store.touch(state)
      this._store.maybeScheduleDispose(state)
      return this._store.snapshot(state)
    })
  }

  async skip ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      const res = this._queues.skip(state)
      if (res.ended) this._stopVoice(guildId)
      else {
        this._playSilence(guildId)
        if (state.isPaused) {
          try {
            const holder = this._getGuildVoice(guildId)
            holder?.player?.pause?.(true)
          } catch {}
        }
      }
      this._store.touch(state)
      this._store.maybeScheduleDispose(state)
      return { ...res, state: this._store.snapshot(state) }
    })
  }

  async clearQueue ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      const cleared = this._queues.clearUpcoming(state)
      this._store.touch(state)
      this._store.maybeScheduleDispose(state)
      return { cleared, state: this._store.snapshot(state) }
    })
  }

  async getQueue ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }

  async nowPlaying ({ guildId, voiceChannelId }) {
    return await this._store.withGuildLock(guildId, async () => {
      const state = this._store.getOrCreate(guildId)
      this._queues.assertSameVoice(state, voiceChannelId)
      this._store.touch(state)
      return this._store.snapshot(state)
    })
  }
}

module.exports = {
  MusicService,
  QueueManager,
  PlayerState,
  AudioProvider,
  PlayerStateStore,
  MusicError,
  MUSIC_ERROR_CODES
}
