const test = require('node:test'), assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const track = name => ({ encoded: name, info: { title: name, author: 'Artist - Topic', uri: `https://example.com/${name}`, sourceName: 'youtube', length: 60000 } })
function fixture(id) {
  const client = new EventEmitter(), player = new EventEmitter(), played = []
  const node = { name: 'public', rest: { resolve: async () => { throw Error('YouTube search unavailable') } } }
  player.node = node; player.playTrack = async options => { played.push(options.track.encoded) }
  player.stopTrack = async () => {}; client.shoukaku = { players: new Map([[id, player]]), nodes: new Map(), options: { nodeResolver: () => node }, leaveVoiceChannel: async () => client.shoukaku.players.delete(id) }
  client.channels = { cache: new Map() }
  require('../handlers/music/index')(client)
  const state = client.music.getState(id)
  Object.assign(state, { currentTrack: track('Seed'), autoplay: true, status: 'playing', startedAt: Date.now() - 60000, lastPosition: 60000 })
  return { client, player, state, played, id }
}
test('autoplay uses the shared search with public backups, skips recent recordings and plays the next song', async () => {
  const f = fixture('autoplay-backup'), calls = []
  f.state.history = [track('Recent')]
  f.client.music.search = async (query, requester, context) => { calls.push({ query, requester, context }); return { tracks: [track('Seed'), track('Recent'), track('Next')] } }
  await f.client.music._playNext(f.id, f.player)
  assert.equal(f.state.currentTrack.info.title, 'Next')
  assert.equal(f.state.currentTrack.info.requester, 'Autoplay')
  assert.deepEqual(f.played, ['Next'])
  assert.equal(calls[0].query, 'Artist'); assert.equal(calls[0].context.guildId, f.id)
})
test('a pending autoplay search cannot restart playback after stopping', async () => {
  const f = fixture('autoplay-stop'); let resolve
  f.client.music.search = () => new Promise(done => { resolve = done })
  const next = f.client.music._playNext(f.id, f.player)
  await new Promise(done => setImmediate(done))
  assert.equal(typeof resolve, 'function')
  const stopping = f.client.music.stop(f.id)
  resolve({ tracks: [track('Late')] }); await Promise.all([next, stopping])
  assert.deepEqual(f.played, [])
  assert.equal(f.client.music.getState(f.id).currentTrack, null)
})
test('a manually queued song takes priority over an autoplay result', async () => {
  const f = fixture('autoplay-queue'); let resolve
  f.client.music.search = () => new Promise(done => { resolve = done })
  const next = f.client.music._playNext(f.id, f.player)
  await new Promise(done => setImmediate(done)); assert.equal(typeof resolve, 'function')
  const queued = f.client.music.enqueue(f.id, [track('Requested')])
  resolve({ tracks: [track('Automatic')] }); await Promise.all([next, queued])
  assert.deepEqual(f.played, ['Requested'])
})
