const { liveMessages, liveTimers, getState } = require('./state')
const { buildNPEmbed, buildControls } = require('./embeds')

const npUpdateQueue = new Map()

function startLiveUpdate(client, guildId) {
  stopLiveUpdate(guildId)
  const interval = setInterval(async () => {
    try {
      const live = liveMessages.get(guildId)
      if (!live) return stopLiveUpdate(guildId)
      const state = getState(guildId)
      if (!state.currentTrack) return stopLiveUpdate(guildId)
      const ch = client.channels.cache.get(live.channelId)
      if (!ch) return stopLiveUpdate(guildId)
      const msg = await ch.messages.fetch(live.messageId).catch(() => null)
      if (!msg) return stopLiveUpdate(guildId)
      const player = client.shoukaku?.players?.get(guildId)
      const pos    = player?.position ?? null
      if (pos !== null) state.lastPosition = pos
      const embed = buildNPEmbed(client, guildId, state, pos)
      await msg.edit({ embeds: [embed], components: buildControls(state) }).catch(() => {})
    } catch {}
  }, 5000)
  liveTimers.set(guildId, interval)
}

function stopLiveUpdate(guildId) {
  const t = liveTimers.get(guildId)
  if (t) { clearInterval(t); liveTimers.delete(guildId) }
}

function scheduleNpUpdate(client, guildId) {
  if (npUpdateQueue.has(guildId)) return
  npUpdateQueue.set(guildId, setTimeout(async () => {
    npUpdateQueue.delete(guildId)
    const live = liveMessages.get(guildId)
    if (!live) return
    const ch = client.channels.cache.get(live.channelId)
    if (!ch) return
    const msg = await ch.messages.fetch(live.messageId).catch(() => null)
    if (!msg) return
    const state  = getState(guildId)
    const player = client.shoukaku?.players?.get(guildId)
    const pos    = player?.position ?? null
    const embed  = buildNPEmbed(client, guildId, state, pos)
    await msg.edit({ embeds: [embed], components: buildControls(state) }).catch(() => {})
  }, 200))
}

module.exports = { startLiveUpdate, stopLiveUpdate, scheduleNpUpdate }
