const test = require('node:test'), assert = require('node:assert/strict')
const { getLyricContext, parseLrc } = require('../handlers/music/lyrics')
test('lyrics have no active verse before its first timestamp and retain instrumental gaps', () => {
  const lines = parseLrc('[00:04.00]Verse\n[00:08.00]\n[00:12.00]Next')
  assert.equal(getLyricContext(lines, 2000).index, -1)
  assert.equal(getLyricContext(lines, 8000).current.text, '')
  assert.equal(getLyricContext(lines, 12000).current.text, 'Next')
})
test('one LRC verse with repeated timestamps appears at each occurrence', () => {
  assert.deepEqual(parseLrc('[00:01.00][00:03.25]Repeat'), [{ ms: 1000, text: 'Repeat' }, { ms: 3250, text: 'Repeat' }])
})
test('the shared playback clock accounts for timescale and freezes loading, pause and recovery', () => {
  const { position } = require('../handlers/music/playback-clock')
  const state = { status: 'playing', startedAt: 9000, lastPosition: 1000, filter: 'nightcore', currentTrack: { info: { length: 180000 } } }
  assert.equal(position(state, 11000), 2300)
  state.paused = true; assert.equal(position(state, 20000), 1000)
  state.paused = false; state.status = 'recovering'; assert.equal(position(state, 20000), 1000)
  state.status = 'loading'; assert.equal(position(state, 20000), 1000)
  state.status = 'playing'; state.filter = 'custom'; state.customFilters = { timescale: { speed: 1.5, rate: 0.8 } }
  assert.ok(Math.abs(position(state, 11000) - 2200) < .001)
})
