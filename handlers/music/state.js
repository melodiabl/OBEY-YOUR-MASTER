// Guild music state management
const playerStates = new Map()   // guildId → state object
const liveMessages = new Map()   // guildId → { messageId, channelId }
const liveTimers   = new Map()   // guildId → intervalId

function getState(guildId) {
  if (!playerStates.has(guildId)) {
    playerStates.set(guildId, {
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
    s.startedAt = null; s.lastPosition = 0; s.autoplay = false; s.radioMode = false; s.shuffle = false
  }
}

module.exports = { playerStates, liveMessages, liveTimers, getState, resetState }
