const test = require('node:test'), assert = require('node:assert/strict')
function fixture() {
  const { StatePlayer, StateRest } = require('../handlers/music/node-player')
  const node = { name: 'public', sessionId: 'synthetic' }
  node.rest = new StateRest(node, { url: 'example.test:443', secure: true, auth: 'public-probe' })
  return { node, player: new StatePlayer('guild', node) }
}
test('the installed Shoukaku control returns sanitized position and time from its same PATCH response', async () => {
  const f = fixture(), requests = []
  f.node.rest.fetch = async request => { requests.push(request); return { paused: true, volume: 0, state: { time: 100000, position: 12500, connected: true, ping: 40 }, track: { encoded: 'encoding', userData: { obeyPlaybackId: 'playback' } }, voice: { token: 'private-voice-token' } } }
  const response = await f.player.setPaused(true)
  assert.equal(response.state.position, 12500); assert.equal(response.state.time, 100000); assert.equal(response.paused, true)
  assert.equal(f.player.paused, true); assert.equal(requests.length, 1); assert.equal(requests[0].options.method, 'PATCH')
  assert.deepEqual(requests[0].options.body, { paused: true }); assert.equal(response.playbackId, 'playback')
  assert.doesNotMatch(JSON.stringify(response), /private-voice-token|encoding|voice/)
})
test('concurrent player controls keep their own node responses', async () => {
  const f = fixture(); let pauseDone, volumeDone
  f.node.rest.fetch = request => new Promise(resolve => {
    if (request.options.body.paused) pauseDone = () => resolve({ paused: true, state: { position: 1000, time: 2000 } })
    else volumeDone = () => resolve({ volume: 0, state: { position: 2000, time: 3000 } })
  })
  const pause = f.player.setPaused(true), volume = f.player.setGlobalVolume(0)
  volumeDone(); const volumeState = await volume
  pauseDone(); const pauseState = await pause
  assert.equal(volumeState.state.position, 2000); assert.equal(volumeState.volume, 0); assert.equal(pauseState.state.position, 1000)
})
test('node request failures propagate and never synthesize a successful snapshot', async () => {
  const f = fixture(); f.node.rest.fetch = async () => { throw Error('unavailable') }
  await assert.rejects(f.player.setPaused(true), /unavailable/); assert.equal(f.player.paused, false)
})
