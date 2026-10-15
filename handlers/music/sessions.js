const clock = require('./playback-clock')
const { createActionQueue } = require('./action-queue')
const { clampMs } = require('./utils')
function snapshot(state) {
  const info = state.currentTrack?.info || state.currentTrack
  const position = clock.position(state)
  return {
    sessionId: state.sessionId, revision: state.revision, voiceChannelId: state.voiceChannelId,
    nodePreference: state.nodePreference || 'auto',
    textChannelId: state.textChannelId, currentTrack: state.currentTrack, queue: state.queue,
    history: state.history, position: clampMs(position || 0, info?.length || 0), paused: state.paused,
    customFilters: state.customFilters, volume: state.volume, loop: state.loop, filter: state.filter,
    autoplay: state.autoplay, shuffle: state.shuffle, radioMode: state.radioMode,
  }
}
function createSessionRepository(model) {
  const writes = createActionQueue()
  function save(guildId, state) {
    const data = JSON.parse(JSON.stringify(snapshot(state)))
    return writes.run(guildId, () => model.findOneAndUpdate({ guildId }, { $set: data }, { upsert: true }))
  }
  return { save, list: () => model.find({ currentTrack: { $ne: null } }).lean(),
    preferences: () => model.find({ nodePreference: { $exists: true } }, 'guildId nodePreference').lean(), drain: writes.drain }
}
module.exports = { snapshot, createSessionRepository }
