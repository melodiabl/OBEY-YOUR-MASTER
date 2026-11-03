const { randomUUID } = require('node:crypto')
// Guild music state management
const playerStates = new Map()   // guildId → state object
const liveMessages = new Map()   // guildId → { messageId, channelId }
const liveTimers   = new Map()   // guildId → intervalId

function getState(guildId) {
  if (!playerStates.has(guildId)) {
    playerStates.set(guildId, {
      sessionId:      randomUUID(),
      revision:       0,
      status:         'disconnected',
      stopRequested:  false,
      nodePreference: 'auto',
      queue:          [],
      currentTrack:   null,
      history:        [],   // in-memory last 10 tracks
      loop:           'none',
      volume:         100,
      filter:         'none',
      paused:         false,
      textChannelId:  null,
      voiceChannelId: null,
      autoplay:       false,
      autoplayPending: false,
      autoplayTransfer: false,
      radioMode:      false,
      shuffle:        false,
      startedAt:      null, // Date.now() when current track started
      lastPosition:   0,
    })
  }
  return playerStates.get(guildId)
}

function resetState(guildId) {
  if (playerStates.has(guildId)) {
    const s = playerStates.get(guildId)
    s.queue = []; s.currentTrack = null; s.history = []
    s.loop = 'none'; s.paused = false; s.filter = 'none'
    s.startedAt = null; s.lastPosition = 0; s.autoplay = false; s.autoplayPending = false; s.autoplayTransfer = false; s.radioMode = false; s.shuffle = false
  }
}

const bound = new WeakMap()
function bindState(state, player) {
  if (bound.get(state) === player) return state
  const { viewTrack, toTrack } = require('./tracks')
  const fields = {
    currentTrack: [() => viewTrack(player.current), value => { player.current = value ? toTrack(value, null, player.node) : null }],
    queue: [() => player.queue.tracks.map(viewTrack), value => { player.queue.tracks = value.map(row => toTrack(row, null, player.node)) }],
    history: [() => player.previous.slice().reverse().map(viewTrack), value => { player.previous = value.slice().reverse().map(row => toTrack(row, null, player.node)) }],
    voiceChannelId: [() => player.voiceChannelId, value => { player.voiceChannelId = value }],
    textChannelId: [() => player.textChannelId, value => { player.textChannelId = value }],
    volume: [() => player.volume, value => { player.volume = value }],
    paused: [() => player.paused, value => { player.paused = value }],
    loop: [() => player.loop === 'off' ? 'none' : player.loop, value => { player.setLoop(value === 'none' ? 'off' : value) }],
    autoplay: [() => player.autoPlay, value => { player.setAutoPlay(Boolean(value)) }],
  }
  for (const [name, [get, set]] of Object.entries(fields)) Object.defineProperty(state, name, { enumerable: true, configurable: true, get, set })
  bound.set(state, player)
  return state
}
module.exports = { playerStates, liveMessages, liveTimers, getState, resetState, bindState }
