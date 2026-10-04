const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
function fixture(id) {
  const client = new EventEmitter(), player = { setPaused: async () => {}, setGlobalVolume: async () => {} }
  client.shoukaku = { players: new Map([[id, player]]), nodes: new Map(), options: { nodeResolver: () => null } }
  client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  const state = client.music.getState(id)
  state.currentTrack = { encoded: 'current', info: { title: 'Current', length: 180000 } }
  state.startedAt = Date.now()
  return { client, state }
}
test('slow search leaves controls responsive and clearing cancels its pending enqueue', async () => {
  const { client, state } = fixture('search-controls')
  let resolve
  client.music.search = () => new Promise(done => { resolve = done })
  const pending = client.music.play('search-controls', 'voice', 'text', 'song', 'user')
  const rejected = assert.rejects(pending, /canceló/)
  await new Promise(done => setImmediate(done))
  await client.music.pause('search-controls')
  await client.music.setVolume('search-controls', 0)
  assert.equal(state.paused, true)
  assert.equal(state.volume, 0)
  client.music.clearQueue('search-controls')
  resolve({ tracks: [{ encoded: 'late', info: { title: 'Late' } }] })
  await rejected
  assert.equal(state.queue.length, 0)
  assert.equal(state.currentTrack.encoded, 'current')
})
