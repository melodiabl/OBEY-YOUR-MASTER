const { liveMessages, liveTimers, getState } = require('./state')
const { buildNPEmbed, buildControls } = require('./embeds')

const scheduled = new Map()
const pending = new Map()
const generations = new Map()

function updatePanel(client, guildId) {
  const generation = generations.get(guildId) || 0
  const write = (pending.get(guildId) || Promise.resolve()).then(async () => {
    if ((generations.get(guildId) || 0) !== generation) return
    const live = liveMessages.get(guildId)
    if (!live || !getState(guildId).currentTrack) return
    const channel = client.channels.cache.get(live.channelId)
    if (!channel) return
    const message = await channel.messages.fetch(live.messageId).catch(() => null)
    if ((generations.get(guildId) || 0) !== generation || liveMessages.get(guildId) !== live) return
    const state = getState(guildId)
    if (!state.currentTrack) return
    if (!message) {
      if (live.isSetup) {
        const replacement = await require('./setup').updatePanel(client, guildId, {
          embeds: [buildNPEmbed(client, guildId, state)], components: buildControls(state),
        })
        if (replacement) live.messageId = replacement.id
      }
      return
    }
    await message.edit({ embeds: [buildNPEmbed(client, guildId, state)], components: buildControls(state) })
  }).catch(error => console.warn(`[Music] Panel edit failed (${guildId}):`, error.message))
  pending.set(guildId, write)
  write.finally(() => { if (pending.get(guildId) === write) pending.delete(guildId) })
  return write
}

function startLiveUpdate(client, guildId) {
  stopLiveUpdate(guildId)
  const timer = setInterval(() => {
    if (!liveMessages.has(guildId) || !getState(guildId).currentTrack) return stopLiveUpdate(guildId)
    updatePanel(client, guildId)
  }, 5000)
  timer.unref?.()
  liveTimers.set(guildId, timer)
}

function stopLiveUpdate(guildId) {
  clearInterval(liveTimers.get(guildId))
  liveTimers.delete(guildId)
  clearTimeout(scheduled.get(guildId))
  scheduled.delete(guildId)
  generations.set(guildId, (generations.get(guildId) || 0) + 1)
  return pending.get(guildId) || Promise.resolve()
}

function scheduleNpUpdate(client, guildId) {
  if (scheduled.has(guildId)) return
  const timer = setTimeout(() => {
    scheduled.delete(guildId)
    updatePanel(client, guildId)
  }, 200)
  timer.unref?.()
  scheduled.set(guildId, timer)
}

module.exports = { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate, updatePanel }
