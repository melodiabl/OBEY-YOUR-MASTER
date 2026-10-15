const test = require('node:test'), assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const tracks = [{ info: { title: 'First', uri: 'https://example.test/first' } }, { info: { title: 'Second', uri: 'https://example.test/second' } }]
function fixture(id) {
  const client = new EventEmitter(), added = []
  client.shoukaku = { players: new Map(), nodes: new Map(), options: {} }
  require('../handlers/music/index')(client)
  client.music.joinChannel = async () => ({})
  client.music.enqueue = async (_, rows) => { added.push(...rows); return rows.length }
  return { client, added, id }
}
test('playing a saved collection enqueues its order once with the current requester', async () => {
  const f = fixture('collection-order')
  assert.equal(await f.client.music.playCollection(f.id, 'voice', 'text', tracks, { id: 'u', username: 'User' }), 2)
  assert.deepEqual(f.added.map(t => t.info.title), ['First', 'Second'])
  assert.ok(f.added.every(t => t.info.requesterId === 'u'))
  assert.equal(tracks[0].info.requesterId, undefined)
})
test('stopping during collection connection cannot enqueue the collection afterwards', async () => {
  const f = fixture('collection-stop'); let release, entered
  const connected = new Promise(resolve => { entered = resolve })
  f.client.music.joinChannel = () => { entered(); return new Promise(resolve => { release = resolve }) }
  const pending = f.client.music.playCollection(f.id, 'voice', 'text', tracks, { id: 'u' })
  await connected
  const stopping = f.client.music.stop(f.id); release({})
  await assert.rejects(pending, /collection_cancelled/)
  await stopping; assert.deepEqual(f.added, [])
})
test('a node transition rejects collection playback before connecting', async () => {
  const f = fixture('collection-transition')
  f.client.music.getState(f.id).nodeTransition = true
  await assert.rejects(f.client.music.playCollection(f.id, 'voice', 'text', tracks, { id: 'u' }), /node_transition/)
  assert.deepEqual(f.added, [])
})
