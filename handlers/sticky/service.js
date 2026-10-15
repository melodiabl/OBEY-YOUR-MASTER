'use strict'
const { randomUUID } = require('node:crypto')
const scope = (guildId, channelId) => {
  if (![guildId, channelId].every(v => typeof v === 'string' && /^\d{17,20}$/.test(v))) throw new Error('INVALID_SCOPE')
  return `${guildId}:${channelId}`
}
// store: get(key), insert(key,data), cas(key,revision,patch). CAS must be atomic.
// An operation is deliberately never expired automatically: unknown sends require reconciliation.
function createStickyService({ store, transport, authorize, clock = Date.now, operationId = randomUUID }) {
  if (!store || !transport || typeof authorize !== 'function') throw new Error('DEPENDENCIES_REQUIRED')
  async function configure({ guildId, channelId, actor, content, minMessages = 5, debounceSeconds = 30, enabled = false }) {
    const key = scope(guildId, channelId)
    if (!await authorize({ guildId, channelId, actor })) throw new Error('FORBIDDEN')
    if (typeof content !== 'string' || !content.trim() || content.length > 2000 ||
        !Number.isInteger(minMessages) || minMessages < 1 || minMessages > 100 ||
        !Number.isInteger(debounceSeconds) || debounceSeconds < 10 || debounceSeconds > 600 || typeof enabled !== 'boolean') throw new Error('INVALID_CONFIG')
    const current = await store.get(key)
    if (current?.operation || current?.previousMessageId) throw new Error('RECONCILIATION_REQUIRED')
    const patch = { guildId, channelId, content, minMessages, debounceMs: debounceSeconds * 1000, enabled,
      count: 0, dueAt: null, lastActivityId: null, status: enabled ? 'ready' : 'paused' }
    const saved = current ? await store.cas(key, current.revision, patch) : await store.insert(key, { ...patch, revision: 0, currentMessageId: null, previousMessageId: null, operation: null })
    if (!saved) throw new Error('CONFLICT')
    return saved
  }
  async function observe({ guildId, channelId, messageId, bot = false, webhook = false }) {
    const key = scope(guildId, channelId)
    if (bot || webhook) return { status: 'ignored' }
    if (typeof messageId !== 'string' || !/^\d{17,20}$/.test(messageId)) throw new Error('INVALID_MESSAGE')
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await store.get(key)
      if (!current?.enabled || current.operation || current.previousMessageId) return { status: 'inactive' }
      // Snowflakes are monotonic. Duplicate/late deliveries never increase the counter.
      if (current.lastActivityId && BigInt(messageId) <= BigInt(current.lastActivityId)) return { status: 'ignored' }
      const count = Math.min(current.count + 1, current.minMessages)
      const dueAt = current.dueAt ?? (count >= current.minMessages ? clock() + current.debounceMs : null)
      const result = await store.cas(key, current.revision, { count, dueAt, lastActivityId: messageId })
      if (result) return { status: dueAt === null ? 'counting' : 'waiting', dueAt }
    }
    throw new Error('CONFLICT')
  }
  async function run({ guildId, channelId }) {
    const key = scope(guildId, channelId), current = await store.get(key)
    if (!current?.enabled || current.operation || current.previousMessageId || current.dueAt === null || current.dueAt > clock()) return { status: 'idle' }
    const operation = { id: operationId(), startedAt: clock() }
    const claimed = await store.cas(key, current.revision, { operation, status: 'sending' })
    if (!claimed) return { status: 'busy' }
    // Revalidate guild/channel ownership and bot permissions immediately before sending.
    let sent
    try {
      await transport.assertChannel({ guildId, channelId })
      sent = await transport.send({ guildId, channelId, operationId: operation.id, payload: { content: claimed.content, allowedMentions: { parse: [], repliedUser: false } } })
      if (typeof sent?.id !== 'string' || !/^\d{17,20}$/.test(sent.id)) throw new Error('INVALID_RECEIPT')
    } catch {
      await store.cas(key, claimed.revision, { status: 'reconciliation_required' })
      return { status: 'reconciliation_required', operationId: operation.id }
    }
    // If persistence fails the durable operation remains locked; never send again blindly.
    const recorded = await store.cas(key, claimed.revision, { currentMessageId: sent.id, previousMessageId: claimed.currentMessageId, status: 'cleanup_pending' })
    if (!recorded) return { status: 'reconciliation_required', operationId: operation.id }
    return cleanup(key, recorded)
  }
  async function cleanup(key, current) {
    if (current.previousMessageId && current.previousMessageId !== current.currentMessageId) {
      try {
        // The adapter must fetch and verify author/application ownership, never delete by ID alone.
        await transport.deleteOwned({ guildId: current.guildId, channelId: current.channelId, messageId: current.previousMessageId })
      } catch { return { status: 'cleanup_pending' } }
    }
    const saved = await store.cas(key, current.revision, { previousMessageId: null, operation: null, count: 0, dueAt: null, status: current.enabled ? 'ready' : 'paused' })
    return { status: saved ? 'success' : 'reconciliation_required' }
  }
  async function repair({ guildId, channelId, actor }) {
    const key = scope(guildId, channelId)
    if (!await authorize({ guildId, channelId, actor })) throw new Error('FORBIDDEN')
    const current = await store.get(key)
    if (!current) return { status: 'missing' }
    // Only cleanup with a persisted new receipt is safe. Unknown sends require external evidence.
    if (current.status !== 'cleanup_pending') return { status: current.operation ? 'reconciliation_required' : 'idle' }
    return cleanup(key, current)
  }
  return { configure, observe, run, repair }
}
module.exports = { createStickyService, scope }
