const { liveMessages, liveTimers, getState } = require('./state')
const { buildNPEmbed, buildControls } = require('./embeds')

const scheduled = new Map()
const pending = new Map()
const generations = new Map()

async function renderPanel(client, guildId, generation) {
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
}

function updatePanel(client, guildId) {
  const generation = generations.get(guildId) || 0, current = pending.get(guildId)
  if (current) {
    current.dirty = true
    current.generation = generation
    return current.promise
  }
  // Keep one in-flight edit and one request to render the latest state.
  const job = { dirty: true, generation, promise: null }
  pending.set(guildId, job)
  job.promise = Promise.resolve().then(async () => {
    do {
      job.dirty = false
      await renderPanel(client, guildId, job.generation)
        .catch(error => console.warn(`[Music] Panel edit failed (${guildId}):`, error.message))
    } while (job.dirty)
  }).finally(() => { if (pending.get(guildId) === job) pending.delete(guildId) })
  return job.promise
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
  const job = pending.get(guildId)
  if (job) job.dirty = false
  return job?.promise || Promise.resolve()
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
