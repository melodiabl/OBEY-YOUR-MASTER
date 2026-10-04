const { test } = require('node:test')
const assert = require('node:assert/strict')
const SyncMap = require('../handlers/sync-map')
const { execute } = require('../handlers/music/saved-queues')

test('saved queues keep current song metadata and reload through the shared player', async () => {
  const writes = [], queued = []
  const store = new SyncMap({ findOneAndUpdate: async (_, value) => writes.push(value), updateOne: async (_, value) => writes.push(value) }, 'userId')
  const state = { currentTrack: { info: { title: 'Current', uri: 'https://example.org/current', author: 'Artist', length: 60000 } }, queue: [{ info: { title: 'Next', uri: 'https://example.org/next' } }] }
  const client = { queuesaves: store, music: { getState: () => state, joinChannel: async () => {}, enqueue: async (_, tracks) => queued.push(...tracks) } }
  const context = { user: { id: 'owner', username: 'Owner' }, guildId: 'guild', voiceChannelId: 'voice', textChannelId: 'text' }
  await execute(client, context, ['cs', 'mix'])
  assert.equal(store.get('owner', 'mix')[0].title, 'Current')
  assert.equal(store.get('owner', 'mix').length, 2)
  await execute(client, context, ['load', 'mix'])
  assert.equal(queued[0].info.uri, 'https://example.org/current')
  assert.equal(queued[0].info.requesterId, 'owner')
  store.set('owner', [], 'other')
  await execute(client, context, ['delete', 'mix'])
  assert.equal(store.get('owner', 'mix'), null)
  assert.deepEqual(store.get('owner', 'other'), [])
  assert.ok(writes.some(write => write.$unset?.mix === 1))
  await assert.rejects(execute(client, context, ['create', '__proto__']), /válido/)
  await assert.rejects(execute(client, { ...context, user: { id: 'other-user' } }, ['play', 'other']), /No existe/)
})

test('removing an invalid saved queue position leaves data intact', async () => {
  const store = new SyncMap({ findOneAndUpdate: async () => {} }, 'userId')
  store.set('user', [{ title: 'Track', url: 'https://example.org' }], 'mix')
  const client = { queuesaves: store, music: { getState: () => ({}) } }
  await assert.rejects(execute(client, { user: { id: 'user' } }, ['removetrack', 'mix', 'no-number']), /posición/)
  assert.equal(store.get('user', 'mix').length, 1)
})
