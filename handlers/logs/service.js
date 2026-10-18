const { randomUUID, createHash } = require('node:crypto')
const { PermissionFlagsBits: F } = require('discord.js')
const { localeFor, normalizeLocale } = require('../i18n')
const { resolveLogDestination, mayRevealSource, includeMessageContent, CATEGORIES } = require('./policy')
const { buildLogPayload } = require('./presentation')

function createLogService(client, { write = row => console.info(JSON.stringify(row)), now = Date.now } = {}) {
  const queues = new Map(), pauses = new Map()
  const counts = { sent: 0, failed: 0, skipped: 0, dropped: 0 }
  let closing = false
  const active = () => !closing && !client._shuttingDown && client._dbReady && client.isReady()
  const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12)
  const keyFor = record => record.guildId + ':' + record.category
  function result(record, status, code, messageId) {
    if (Object.hasOwn(counts, status)) counts[status]++
    if (status !== 'skipped' && status !== 'paused') write({ event: 'guild_log_delivery', entryPoint: record.origin === 'audit' ? 'audit_gateway' : 'gateway', requestId: record.requestId,
      guild: hash(record.guildId), category: record.category, kind: record.kind, status, ...(code ? { code } : {}) })
    return { status, ...(code ? { code } : {}), ...(messageId ? { messageId } : {}) }
  }
  function pause(record, channelId, code) {
    pauses.set(keyFor(record), { channelId, until: now() + 60000, code })
    return result(record, 'failed', code)
  }
  async function deliver(record) {
    if (!active()) return result(record, 'skipped', 'closing')
    const guild = client.guilds.cache.get(record.guildId)
    if (!guild || guild.available === false) return result(record, 'skipped', 'guild_unavailable')
    const settings = client.settings.get(record.guildId) || {}, destination = resolveLogDestination(settings, record.category)
    if (!destination.channelId) return result(record, 'skipped', destination.state)
    const sourceIds = [...new Set([record.sourceChannelId, ...(record.additionalSourceChannelIds || [])].filter(Boolean))].slice(0, 2)
    if (Array.isArray(settings.logger?.excludedChannelIds) && sourceIds.some(id => settings.logger.excludedChannelIds.includes(id))) return result(record, 'skipped', 'excluded_channel')
    const previous = pauses.get(keyFor(record))
    if (previous?.channelId === destination.channelId && previous.until > now()) return result(record, 'paused', previous.code)
    pauses.delete(keyFor(record))
    try {
      const target = await guild.channels.fetch(destination.channelId, { force: true })
      if (!target || target.guildId !== guild.id || ![0, 5].includes(target.type)) return pause(record, destination.channelId, 'invalid_destination')
      const sources = await Promise.all(sourceIds.map(id => id === target.id ? target : guild.channels.fetch(id, { force: true }).catch(() => null)))
      const source = sources[0] || null
      const current = client.settings.get(record.guildId) || {}
      if (!active() || resolveLogDestination(current, record.category).channelId !== target.id ||
        Array.isArray(current.logger?.excludedChannelIds) && sourceIds.some(id => current.logger.excludedChannelIds.includes(id))) return result(record, 'skipped', 'configuration_changed')
      const bot = guild.members.me
      if (!bot || !target.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) return pause(record, destination.channelId, 'missing_permissions')
      const reveal = !sourceIds.length || sources.every(channel => mayRevealSource(channel, target, guild) && (!channel || channel.permissionsFor(bot)?.has(F.ViewChannel)))
      const locale = normalizeLocale(localeFor(client, guild.id)) === 'en' ? 'en' : 'es'
      const payload = buildLogPayload(record, { guild, locale, reveal, content: includeMessageContent(current, source, target, guild) })
      const sent = await target.send({ ...payload, nonce: record.requestId.replaceAll('-', '').slice(0, 25), enforceNonce: true })
      return result(record, 'sent', undefined, sent?.id)
    } catch (error) {
      return pause(record, destination.channelId, error?.code === 10003 ? 'destination_missing' : error?.code === 50013 || error?.code === 50001 ? 'missing_permissions' : 'delivery_unconfirmed')
    }
  }
  return {
    emit(input) {
      if (!active() || !input || !/^\d{17,20}$/.test(input.guildId || '') || !CATEGORIES.includes(input.category)) return Promise.resolve({ status: 'skipped' })
      const record = { ...input, requestId: randomUUID(), observedAt: new Date(now()) }, state = queues.get(record.guildId) || { tail: Promise.resolve(), pending: 0 }
      if (state.pending >= 100) return Promise.resolve(result(record, 'dropped', 'queue_full'))
      queues.set(record.guildId, state); state.pending++
      const operation = state.tail.then(() => deliver(record))
      state.tail = operation.catch(() => {}).finally(() => { state.pending--; if (!state.pending && queues.get(record.guildId) === state) queues.delete(record.guildId) })
      return operation
    },
    stats: () => ({ ...counts, pending: [...queues.values()].reduce((n, queue) => n + queue.pending, 0), paused: [...pauses.values()].filter(value => value.until > now()).length }),
    forget(guildId) { for (const key of pauses.keys()) if (key.startsWith(guildId + ':')) pauses.delete(key) },
    async drain() { await Promise.allSettled([...queues.values()].map(state => state.tail)) },
    async stop() { closing = true; await this.drain(); pauses.clear() },
  }
}
module.exports = { createLogService }
