const test = require('node:test'), assert = require('node:assert/strict')
const { summarize, rank, benchmark } = require('../handlers/music/node-benchmark')
test('benchmark summaries distinguish node RTT, search latency and failed samples', () => {
  const summary = summarize({ id: 'one', label: 'One', auth: 'secret', url: 'private-address' },
    { ready: true, rttMs: [110, 100, 105] }, [{ ms: 800, tracks: 10 }, { ms: 700, tracks: 20 }, { ms: 900, tracks: 10 }], { cpu: { lavalinkLoad: .2 }, players: 30 })
  assert.equal(summary.medianRttMs, 105); assert.equal(summary.medianSearchMs, 800); assert.equal(summary.jitterMs, 10)
  assert.equal(summary.successfulSearches, 3); assert.equal(summary.usable, true); assert.equal(summary.lavalinkCpuPercent, 20)
  assert(!JSON.stringify(summary).includes('secret')); assert(!JSON.stringify(summary).includes('private-address'))
  assert.equal(summarize({ id: 'bad' }, { ready: false, rttMs: [] }, [{ ms: 10, tracks: 0 }]).medianRttMs, null)
})
test('ranking requires working searches and ready sockets before preferring a lower RTT', () => {
  const rows = [{ id: 'fast-broken', usable: false, medianRttMs: 1 }, { id: 'slower', usable: true, medianRttMs: 200, medianSearchMs: 400 }, { id: 'fast', usable: true, medianRttMs: 100, medianSearchMs: 800 }]
  assert.deepEqual(rank(rows).map(r => r.id), ['fast', 'slower', 'fast-broken'])
  assert.deepEqual(rows.map(r => r.id), ['fast-broken', 'slower', 'fast'])
})
test('benchmark skips private and disabled entries and sanitizes provider failures', async () => {
  const entries = [{ id: 'private', visibility: 'private', enabled: true }, { id: 'disabled', visibility: 'public', enabled: false }, { id: 'public', visibility: 'public', enabled: true, auth: 'secret' }]
  const seen = []
  const rows = await benchmark(entries, { socket: async node => { seen.push(node.id); return { ready: true, rttMs: [40, 42, 41] } },
    request: async (_, path) => { if (path === '/stats') throw new Error('secret provider credentials'); return { ms: 150, data: { loadType: 'search', data: [{ encoded: 'abc' }] } } } })
  assert.deepEqual(seen, ['public']); assert.equal(rows[0].usable, true); assert.equal(rows[0].successfulSearches, 3)
  assert(!JSON.stringify(rows).includes('secret')); assert.equal(rows[0].lavalinkCpuPercent, null)
})
test('missing or invalid search results cannot be marked as a usable music node', async () => {
  const rows = await benchmark([{ id: 'one', visibility: 'public', enabled: true }], { socket: async () => ({ ready: true, rttMs: [20] }), request: async (_, path) => ({ ms: 20, data: path === '/stats' ? {} : { loadType: 'search', data: [{ info: {} }] } }) })
  assert.equal(rows[0].usable, false); assert.equal(rows[0].successfulSearches, 0)
})
