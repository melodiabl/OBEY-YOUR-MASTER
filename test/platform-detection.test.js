const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizePublicTrack, platform } = require('../handlers/music/utils')
test('an unrelated hostname containing spotify is not labelled Spotify', () => {
  assert.equal(platform('https://notspotify.example/audio', 'http').name, 'Audio')
})
test('an unidentified audio source is not labelled YouTube', () => {
  assert.equal(platform('https://example.test/audio', 'unknown').name, 'Audio')
})
test('normalizing an unidentified recording does not invent a YouTube identity', () => {
  const track = normalizePublicTrack({ info: { title: 'Audio', uri: 'https://example.test/audio' } })
  assert.equal(platform(track.uri, track.sourceName).name, 'Audio')
})
