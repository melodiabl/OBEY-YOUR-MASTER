const { ActivityType } = require('discord.js')
const { statusSchema } = require('./bot-status-contract')
const runtimes = new WeakMap()
const activityTypes = { PLAYING: ActivityType.Playing, LISTENING: ActivityType.Listening,
  WATCHING: ActivityType.Watching, STREAMING: ActivityType.Streaming, COMPETING: ActivityType.Competing }
const bounded = value => String(value).slice(0, 128).replace(/[\uD800-\uDBFF]$/u, '')
const count = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0
function renderStatusText(client, template) {
  const config = client.config || require('../botconfig/config.json'), guilds = [...(client.guilds?.cache?.values() || [])]
  const created = new Date(client.user?.createdTimestamp), valid = Number.isFinite(created.getTime())
  const compact = value => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count(value))
  const time = valid ? created.toISOString().slice(11, 19) : '—'
  const values = { prefix: config.prefix, guildcount: compact(guilds.length), membercount: compact(guilds.reduce((sum, guild) => sum + count(guild.memberCount), 0)),
    created: valid ? created.toLocaleDateString('en-GB', { timeZone: 'UTC' }) : '—', createdtime: time, createdime: time,
    name: client.user?.username || 'OBEY', tag: client.user?.tag || client.user?.username || 'OBEY', commands: client.commands?.size || 0,
    usedcommands: compact(client.stats?.get?.('global', 'commands')), songsplayed: compact(client.stats?.get?.('global', 'songs')) }
  return bounded(String(template).replace(/\{([a-zA-Z]+)\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key]) : token))
}
function createBotStatusRuntime(client, { timers = { setInterval, clearInterval, setTimeout, clearTimeout } } = {}) {
  let interval, advertisement, second = false, closed = false, started = false
  function clearAd() { if (advertisement !== undefined) timers.clearTimeout(advertisement); advertisement = undefined }
  function send(activities, presence) {
    if (closed || client._shuttingDown) return false
    if (client.isReady?.() === false) { client.botStatusDelivery = 'failed'; return false }
    try { client.user.setPresence({ activities, status: presence }); client.botStatusDelivery = 'queued'; return true }
    catch { client.botStatusDelivery = 'failed'; console.warn('[BotStatus] presence_request_failed'); return false }
  }
  function apply({ rotate = false } = {}) {
    clearAd()
    if (closed || client._shuttingDown) return false
    try {
      const parsed = statusSchema.safeParse((client.config || require('../botconfig/config.json')).status)
      if (!parsed.success) { client.botStatusDelivery = 'failed'; return false }
      const status = parsed.data
      if (started && !rotate) {
        if (interval !== undefined) timers.clearInterval(interval)
        interval = timers.setInterval(() => apply({ rotate: true }), 90000)
        interval?.unref?.()
      }
      second = rotate ? !second : false
      const activity = { name: renderStatusText(client, second ? status.text2 : status.text), type: activityTypes[status.type], ...(status.type === 'STREAMING' ? { url: status.url } : {}) }
      const requested = send([activity], status.presence)
      if (started && client.ad?.enabled) {
        advertisement = timers.setTimeout(() => {
          advertisement = undefined
          if (!client.ad?.enabled || !client.ad.statusad || closed || client._shuttingDown) return
          send([client.ad.statusad], (client.config || require('../botconfig/config.json')).status.presence || 'online')
        }, 75000)
        advertisement?.unref?.()
      }
      return requested
    } catch { client.botStatusDelivery = 'failed'; console.warn('[BotStatus] presence_request_failed'); return false }
  }
  return { apply,
    start() { if (closed || started) return; started = true; apply() },
    stop() { closed = true; clearAd(); if (interval !== undefined) timers.clearInterval(interval); interval = undefined },
  }
}
function botStatusRuntime(client) {
  if (!runtimes.has(client)) { const runtime = createBotStatusRuntime(client); runtimes.set(client, runtime); client.stopBotStatus = runtime.stop }
  return runtimes.get(client)
}
module.exports = { createBotStatusRuntime, botStatusRuntime, renderStatusText }
