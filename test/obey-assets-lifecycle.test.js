const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { Events } = require('discord.js')
const { registerAssetLifecycle } = require('../handlers/assets/lifecycle')
const { createRegistry, selectedAsset } = require('../handlers/assets/registry')

test('the single runtime checks remote availability, fails closed and recovers', async t => {
  const file = selectedAsset('icon.play')
  const emoji = { id: '223456789012345678', name: file.name, sha256: file.sha256, animated: false }
  const registry = createRegistry({ version: 2, applicationId: '423456789012345678', emojis: { 'icon.play': emoji } }, '423456789012345678')
  const client = new EventEmitter()
  let existing = [emoji], fetches = 0, fail = false
  client.application = { id: '423456789012345678', emojis: { fetch: async () => { fetches++; if (fail) throw new Error('private secret'); return new Map(existing.map(item => [item.id, item])) } } }
  const lifecycle = registerAssetLifecycle(client, { registry, applicationId: '423456789012345678' })
  t.after(() => lifecycle.stop())
  assert.equal(registry.emoji('play').id, undefined)
  assert.equal(registerAssetLifecycle(client, { registry }), lifecycle)
  assert.equal(client.listenerCount(Events.ClientReady), 1)
  client.emit(Events.ClientReady)
  await lifecycle.refresh()
  assert.equal(fetches, 1)
  assert.equal(registry.emoji('play').id, emoji.id)
  existing = []
  await lifecycle.refresh()
  assert.equal(registry.emoji('play').id, undefined)
  existing = [emoji]; fail = true
  await lifecycle.refresh()
  assert.equal(registry.emoji('play').id, undefined)
  fail = false
  await lifecycle.refresh()
  assert.equal(registry.emoji('play').id, emoji.id)
  assert.equal(typeof client.stopAssets, 'function')
})

test('refreshes coalesce and shutdown prevents late responses restoring stale IDs', async () => {
  const client = new EventEmitter(), snapshots = []
  let release, fetches = 0
  client.application = { id: '423456789012345678', emojis: { fetch: () => { fetches++; return new Promise(resolve => { release = resolve }) } } }
  const lifecycle = registerAssetLifecycle(client, { applicationId: '423456789012345678', registry: { reconcile: items => snapshots.push(items) } })
  const first = lifecycle.refresh(), second = lifecycle.refresh()
  assert.equal(fetches, 1)
  lifecycle.stop()
  release(new Map([['223456789012345678', { id: '223456789012345678', name: 'valid', animated: false }]]))
  await Promise.all([first, second])
  assert.deepEqual(snapshots, [[]])
  await lifecycle.refresh()
  assert.equal(fetches, 1)
  assert.equal(client.listenerCount(Events.ClientReady), 0)
})

test('a different application is rejected before its emoji list is requested', async () => {
  const client = new EventEmitter(), snapshots = []
  let fetches = 0
  client.application = { id: '523456789012345678', emojis: { fetch: async () => { fetches++; return new Map() } } }
  const lifecycle = registerAssetLifecycle(client, { applicationId: '423456789012345678', registry: { reconcile: items => snapshots.push(items) } })
  await lifecycle.refresh()
  lifecycle.stop()
  assert.equal(fetches, 0)
  assert.deepEqual(snapshots, [[], []])
})
