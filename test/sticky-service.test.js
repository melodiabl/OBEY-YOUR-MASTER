const test = require('node:test')
const assert = require('node:assert/strict')
const { createStickyService } = require('../handlers/sticky/service')
const guildId = '100000000000000001', channelId = '100000000000000002'
const context = { guildId, channelId, actor: 'staff' }
function fixture() {
  const rows = new Map(), calls = [], state = { now: 0, failSend: false, failDelete: false, allowed: true }
  const store = {
    async get(k) { return structuredClone(rows.get(k)) },
    async insert(k, d) { if (rows.has(k)) return null; rows.set(k, structuredClone(d)); return structuredClone(d) },
    async cas(k, r, p) { const d = rows.get(k); if (!d || d.revision !== r) return null; const next = { ...d, ...structuredClone(p), revision: r + 1 }; rows.set(k, next); return structuredClone(next) },
  }
  const transport = {
    async assertChannel() {},
    async send(c) { calls.push(['send', c]); if (state.failSend) throw new Error('timeout'); return { id: `20000000000000000${calls.filter(x => x[0] === 'send').length}` } },
    async deleteOwned(c) { calls.push(['delete', c]); if (state.failDelete) throw new Error('403') },
  }
  const service = createStickyService({ store, transport, authorize: async () => state.allowed, clock: () => state.now, operationId: () => 'operation' })
  const configure = extra => service.configure({ ...context, content: '@everyone Notice', minMessages: 1, debounceSeconds: 10, enabled: true, ...extra })
  const observe = messageId => service.observe({ ...context, messageId })
  return { rows, calls, state, service, configure, observe }
}
test('requires authorized valid configuration and preserves disabled default', async () => {
  const f = fixture(); f.state.allowed = false
  await assert.rejects(f.configure(), /FORBIDDEN/); assert.equal(f.rows.size, 0)
  f.state.allowed = true; await assert.rejects(f.configure({ minMessages: 0 }), /INVALID_CONFIG/)
  const saved = await f.service.configure({ ...context, content: 'Notice' }); assert.equal(saved.enabled, false)
})
test('ignores bots, duplicate and late events; debounce does not extend on every message', async () => {
  const f = fixture(); await f.configure()
  await f.service.observe({ ...context, bot: true, messageId: '100000000000000003' })
  assert.equal((await f.observe('100000000000000004')).dueAt, 10000)
  assert.equal((await f.observe('100000000000000004')).status, 'ignored')
  assert.equal((await f.observe('100000000000000003')).status, 'ignored')
  f.state.now = 5000; assert.equal((await f.observe('100000000000000005')).dueAt, 10000)
  assert.equal((await f.service.run(context)).status, 'idle')
})
test('concurrent workers send once and suppress mentions', async () => {
  const f = fixture(); await f.configure(); await f.observe('100000000000000004'); f.state.now = 10000
  const results = await Promise.all([f.service.run(context), f.service.run(context)])
  assert.equal(results.filter(x => x.status === 'success').length, 1)
  assert.equal(f.calls.filter(x => x[0] === 'send').length, 1)
  assert.deepEqual(f.calls[0][1].payload.allowedMentions.parse, [])
  assert.equal((await f.service.run(context)).status, 'idle')
})
test('unknown send remains locked and cannot be overwritten', async () => {
  const f = fixture(); await f.configure(); await f.observe('100000000000000004'); f.state.now = 10000; f.state.failSend = true
  assert.equal((await f.service.run(context)).status, 'reconciliation_required')
  assert.equal((await f.service.run(context)).status, 'idle')
  assert.equal((await f.service.repair(context)).status, 'reconciliation_required')
  await assert.rejects(f.configure(), /RECONCILIATION_REQUIRED/)
  assert.equal(f.calls.length, 1)
})
test('failed cleanup is retried without new sends and never loses the old ID', async () => {
  const f = fixture(); await f.configure(); await f.observe('100000000000000004'); f.state.now = 10000; await f.service.run(context)
  await f.observe('100000000000000005'); f.state.now = 20000; f.state.failDelete = true
  assert.equal((await f.service.run(context)).status, 'cleanup_pending')
  assert.equal((await f.service.run(context)).status, 'idle')
  f.state.failDelete = false; assert.equal((await f.service.repair(context)).status, 'success')
  assert.equal(f.calls.filter(x => x[0] === 'send').length, 2)
  const ids = f.calls.filter(x => x[0] === 'delete').map(x => x[1].messageId)
  assert.deepEqual(ids, ['200000000000000001', '200000000000000001'])
})
test('pausing before a pending run prevents publication', async () => {
  const f = fixture(); await f.configure(); await f.observe('100000000000000004'); await f.configure({ enabled: false }); f.state.now = 10000
  assert.equal((await f.service.run(context)).status, 'idle'); assert.equal(f.calls.length, 0)
})

test('one guild cannot advance another guild configuration', async () => {
  const f = fixture(); await f.configure()
  const other = { ...context, guildId: '100000000000000009' }
  assert.equal((await f.service.observe({ ...other, messageId: '100000000000000004' })).status, 'inactive')
  f.state.now = 20000; assert.equal((await f.service.run(other)).status, 'idle'); assert.equal(f.calls.length, 0)
})
test('new worker respects a durable pending operation after restart', async () => {
  const f = fixture(); await f.configure(); await f.observe('100000000000000004'); f.state.now = 10000; f.state.failSend = true
  await f.service.run(context)
  const store = { async get(k) { return structuredClone(f.rows.get(k)) } }
  const service = createStickyService({ store, transport: { async send() { assert.fail('must not resend') } }, authorize: async () => true, clock: () => 30000 })
  assert.equal((await service.run(context)).status, 'idle')
  assert.equal((await service.repair(context)).status, 'reconciliation_required')
})
