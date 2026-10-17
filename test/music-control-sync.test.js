const test = require('node:test'), assert = require('node:assert/strict'), { EventEmitter } = require('node:events')
const settle = () => new Promise(resolve => setImmediate(resolve))
function fixture(id) {
  const client = new EventEmitter(), player = new EventEmitter()
  player.guildId = id
  player.setPaused = async () => {}; player.stopTrack = async () => {}
  client.shoukaku = { players: new Map([[id, player]]), nodes: new Map(), options: { nodeResolver: () => null }, leaveVoiceChannel: async () => client.shoukaku.players.delete(id) }
  client.channels = { cache: new Map() }
  require('../handlers/music/index')(client)
  const state = client.music.getState(id)
  Object.assign(state, { currentTrack: { encoded: 'track', info: { title: 'Song', length: 180000 } }, status: 'playing', paused: false, startedAt: Date.now() - 10000, lastPosition: 10000 })
  return { client, player, state, cleanup: async () => { client._shuttingDown = true; await require('../handlers/music/liveupdate').stopLiveUpdate(id); require('../handlers/music/state').playerStates.delete(id) } }
}
test('resuming a restored paused session starts its clock immediately', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const f = fixture('resume-restored-clock')
  Object.assign(f.state, { status: 'paused', paused: true, startedAt: null, lastPosition: 42000 })
  await f.client.music.pause('resume-restored-clock')
  t.mock.timers.tick(1000)
  const state = f.client.music.getPublicState('resume-restored-clock')
  assert.equal(state.status, 'playing'); assert.equal(state.clockRunning, true); assert.equal(state.current.elapsed, 43000)
  await f.cleanup()
})
test('stop sends its audio request before a slow Discord panel finishes', async () => {
  const id = 'stop-before-discord', f = fixture(id), { liveMessages } = require('../handlers/music/state'), { updatePanel } = require('../handlers/music/liveupdate')
  let release, began, stopped = false
  const started = new Promise(resolve => { began = resolve })
  f.client.channels.cache.set('text', { messages: { edit: async () => { began(); await new Promise(resolve => { release = resolve }) } } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' })
  const edit = updatePanel(f.client, id); await started
  f.player.stopTrack = async () => { stopped = true }
  const stopping = f.client.music.stop(id); await settle()
  const audioStoppedBeforeEdit = stopped
  release(); await Promise.all([edit, stopping]); liveMessages.delete(id); await f.cleanup()
  assert.equal(audioStoppedBeforeEdit, true)
})
test('pause uses the node acknowledgement position instead of its earlier local estimate', async () => {
  const f = fixture('confirmed-pause-time')
  f.player.setPaused = async () => ({ paused: true, state: { position: 12500, time: Date.now(), connected: true, ping: 30 }, receivedAt: Date.now() })
  await f.client.music.pause('confirmed-pause-time')
  assert.equal(f.client.music.getPublicState('confirmed-pause-time').current.elapsed, 12500)
  await f.cleanup()
})
test('a corrected node position is published immediately without saving on every packet', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const f = fixture('clock-published'), events = []
  require('../handlers/music/player-events')(f.client, f.player, 'clock-published', { emitState: (...args) => events.push(args), elapsedForState: () => 10000 })
  f.player.emit('update', { state: { position: 23000, time: Date.now() - 300, connected: true, ping: 40 } })
  assert.equal(f.state.lastPosition, 23300); assert.deepEqual(events, [['clock-published', { persist: false }]])
  await f.cleanup()
})
test('a rejected audio stop keeps the current track and queue visible', async () => {
  const f = fixture('stop-rejected'), track = f.state.currentTrack
  f.state.queue = [{ encoded: 'next' }]
  f.player.stopTrack = async () => { throw Error('node unavailable') }
  await assert.rejects(f.client.music.stop('stop-rejected'), /node unavailable/)
  assert.equal(f.state.currentTrack, track); assert.equal(f.state.queue[0].encoded, 'next')
  assert.equal(f.state.status, 'playing'); await f.cleanup()
})
test('the real Shoukaku adapter passes confirmed time all the way into the music clock', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'adapter-controller', f = fixture(id), { StatePlayer, StateRest } = require('../handlers/music/node-player')
  const node = { name: 'public', sessionId: 'synthetic' }
  node.rest = new StateRest(node, { url: 'example.test:443', secure: true, auth: 'public-probe' })
  let requests = 0
  node.rest.fetch = async () => { requests++; return { paused: true, state: { position: 14500, time: 99900, connected: true } } }
  f.client.shoukaku.players.set(id, new StatePlayer(id, node))
  await f.client.music.pause(id)
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 14500); assert.equal(requests, 1)
  await f.cleanup()
})
test('seek takes the confirmed node position and rejects older websocket samples', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'confirmed-seek', f = fixture(id)
  f.player.seekTo = async () => ({ state: { position: 60400, time: 99900, connected: true } })
  f.client.music._bindPlayerEvents(f.player, id)
  await f.client.music.seek(id, 60000)
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 60500)
  f.player.emit('update', { state: { position: 58000, time: 99800, connected: true } })
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 60500)
  await f.cleanup()
})
test('a provider initial zero cannot erase a requested seek offset', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'seek-initial-zero', f = fixture(id)
  f.player.seekTo = async () => ({ state: { position: 0, time: 100000, connected: true } })
  await f.client.music.seek(id, 60000)
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 60000)
  await f.cleanup()
})
test('timescale changes reanchor to confirmed node time before advancing at the new rate', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'confirmed-filter', f = fixture(id)
  f.player.setFilters = async () => ({ state: { position: 12000, time: 99900, connected: true } })
  await f.client.music.setFilter(id, 'nightcore')
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 12130)
  t.mock.timers.tick(1000)
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 13430)
  await f.cleanup()
})
test('play acknowledgement starts the clock and a later start event cannot rewind it', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'confirmed-start', f = fixture(id)
  f.state.queue = [f.state.currentTrack]; f.state.currentTrack = null
  f.player.playTrack = async options => ({ playbackId: options.track.userData.obeyPlaybackId, trackPresent: true, paused: false, state: { position: 250, time: 99900, connected: true } })
  f.client.music._bindPlayerEvents(f.player, id)
  await f.client.music._playNext(id)
  assert.equal(f.client.music.getPublicState(id).status, 'playing')
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 350)
  t.mock.timers.tick(1000)
  f.player.emit('start', { track: { encoded: 'track', userData: { obeyPlaybackId: f.state.playbackId } } })
  assert.equal(f.client.music.getPublicState(id).current.elapsed, 1350)
  await settle(); await f.cleanup()
})
test('a newly rendered Discord panel starts at the current clock instead of zero', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 })
  const id = 'panel-current-time', f = fixture(id)
  f.state.textChannelId = 'text'; f.state.lastPosition = 42000; f.state.startedAt = 58000
  let description
  f.client.channels.cache.set('text', { send: async payload => { description = payload.embeds[0].toJSON().description; return null } })
  await f.client.music.sendNowPlaying(id, f.state.currentTrack)
  assert.match(description, /0:42/)
  await f.cleanup()
})
