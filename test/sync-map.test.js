const { test } = require('node:test')
const assert = require('node:assert/strict')
const SyncMap = require('../handlers/sync-map')

test('legacy database writes are ordered and flush waits for persistence', async () => {
  const writes = []
  const store = new SyncMap({ modelName: 'Fixture', findOneAndUpdate: async (_, update) => writes.push(update) })
  store.ensure('guild', { volume: 100 })
  store.set('guild', 0, 'volume')
  store.set('guild', 20, 'volume')
  await store.flush()
  assert.equal(writes.length, 3)
  assert.equal(writes[2].$set.volume, 20)
  assert.equal(store.get('guild', 'volume'), 20)
})

test('database failures are visible at the flush gate', async () => {
  const store = new SyncMap({ modelName: 'Fixture', findOneAndUpdate: async () => { throw new Error('offline') } })
  store.ensure('guild', {})
  await assert.rejects(store.flush(), /guardar/)
})

test('preload failures do not masquerade as empty data', async () => {
  const store = new SyncMap({ modelName: 'Fixture', find: () => ({ lean: async () => { throw new Error('offline') } }) })
  await assert.rejects(store.preload(), /Preload Fixture/)
})

test('unsafe database paths cannot modify prototypes', () => {
  const store = new SyncMap({ modelName: 'Fixture', findOneAndUpdate: async () => {} })
  assert.throws(() => store.set('guild', true, '__proto__.polluted'), /Invalid data path/)
  assert.equal({}.polluted, undefined)
})
