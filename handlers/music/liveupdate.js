const { liveMessages, liveTimers, getState } = require('./state')
const { buildNPEmbed, buildControls } = require('./embeds')
const { measureRequest } = require('./request-timing')

const scheduled = new Map()
const pending = new Map()
const generations = new Map()

async function renderPanel(client, guildId, generation) {
  if ((generations.get(guildId) || 0) !== generation) return
  const live = liveMessages.get(guildId)
  if (!live || !getState(guildId).currentTrack) return
  const channel = client.channels.cache.get(live.channelId)
  if (!channel) return
  const state = getState(guildId)
  try {
    await measureRequest(guildId, 'panel_edit', () => channel.messages.edit(live.messageId, {
      embeds: [buildNPEmbed(client, guildId, state)], components: buildControls(state),
    }))
  } catch (error) {
    // Only a deleted message needs replacement; transient errors must not create duplicates.
    if (error.code !== 10008 || !live.isSetup) throw error
    if ((generations.get(guildId) || 0) !== generation || liveMessages.get(guildId) !== live || !getState(guildId).currentTrack) return
    const latest = getState(guildId)
    const replacement = await require('./setup').updatePanel(client, guildId, {
      embeds: [buildNPEmbed(client, guildId, latest)], components: buildControls(latest),
    })
    if (replacement) live.messageId = replacement.id
  }
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
    if (!pending.has(guildId)) updatePanel(client, guildId)
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

function scheduleNpUpdate(client, guildId, { immediate = false } = {}) {
  if (immediate) {
    clearTimeout(scheduled.get(guildId)); scheduled.delete(guildId)
    return updatePanel(client, guildId)
  }
  if (scheduled.has(guildId)) return
  const timer = setTimeout(() => {
    scheduled.delete(guildId)
    updatePanel(client, guildId)
  }, 200)
  timer.unref?.()
  scheduled.set(guildId, timer)
}

module.exports = { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate, updatePanel }
