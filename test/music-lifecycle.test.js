const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
function fixture(id) {
  const client = new EventEmitter(), player = new EventEmitter()
  player.playTrack = async options => { player.track = options.track.encoded; player.emit('start', { track: { encoded: player.track } }) }
  player.stopTrack = async () => {}
  player.setGlobalVolume = async () => {}
  client.shoukaku = { players: new Map([[id, player]]), nodes: new Map(), options: { nodeResolver: () => null } }
  client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  client.music._bindPlayerEvents(player, id)
  return { client, player, state: client.music.getState(id) }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 40))
test('late end events cannot skip the next requested song', async () => {
  const { client, player, state } = fixture('events-finished')
  state.currentTrack = { encoded: 'first', info: { title: 'First', length: 10000 } }
  state.queue = [{ encoded: 'second', info: { title: 'Second', length: 10000 } }, { encoded: 'third', info: { title: 'Third', length: 10000 } }]
  player.emit('end', { reason: 'finished', track: { encoded: 'first' } })
  player.emit('end', { reason: 'finished', track: { encoded: 'first' } })
  await settle()
  assert.equal(state.currentTrack.encoded, 'second')
  assert.equal(state.queue[0].encoded, 'third')
  assert.equal(client.music.getPublicState('events-finished').status, 'playing')
  player.emit('end', { reason: 'finished', track: { encoded: 'second' } })
  await settle()
  player.emit('end', { reason: 'finished', track: { encoded: 'third' } })
  await settle()
  assert.equal(client.music.getPublicState('events-finished').active, false)
})

test('publication does not wait for a slow Discord message edit', async () => {
  const { client, player, state } = fixture('events-start')
  state.currentTrack = { encoded: 'track', info: { title: 'Current', length: 10000 } }
  let publish = 0, release
  client.on('playerStateUpdate', () => publish++)
  client.music.sendNowPlaying = () => new Promise(resolve => { release = resolve })
  player.emit('start', { track: { encoded: 'track' } })
  assert.equal(publish, 1)
  release()
})

test('restored paused playback keeps its saved clock when the start event arrives', () => {
  const { client, player, state } = fixture('events-restored')
  state.currentTrack = { encoded: 'restored', info: { title: 'Restored', length: 180000 } }
  state.playbackId = 'new-playback'
  state.playbackOptions = { position: 42000, paused: true }
  player.emit('start', { track: { encoded: 'restored', userData: { obeyPlaybackId: 'old-playback' } } })
  assert.equal(state.status, 'disconnected')
  player.emit('start', { track: { encoded: 'restored', userData: { obeyPlaybackId: 'new-playback' } } })
  const publicState = client.music.getPublicState('events-restored')
  assert.equal(publicState.paused, true)
  assert.equal(publicState.current.elapsed, 42000)
  assert.equal(publicState.status, 'paused')
})

test('paused player updates cannot erase the saved position with an initial zero', () => {
  const { client, player, state } = fixture('paused-update-offset')
  state.currentTrack = { encoded: 'paused', info: { length: 180000 } }
  state.paused = true; state.status = 'paused'; state.lastPosition = 42000
  player.emit('update', { state: { position: 0, time: Date.now() } })
  assert.equal(client.music.getPublicState('paused-update-offset').current.elapsed, 42000)
})
