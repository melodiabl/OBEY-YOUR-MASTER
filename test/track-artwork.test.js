const { test } = require('node:test')
const assert = require('node:assert/strict')
const artwork = require('../dashboard/public/js/track-artwork')
test('covers resolve YouTube links and provider metadata with a local fallback', () => {
  assert.equal(artwork.url({ uri: 'https://www.youtube.com/watch?v=fRIhCiUVaKs' }), 'https://i.ytimg.com/vi/fRIhCiUVaKs/hqdefault.jpg')
  assert.equal(artwork.url({ uri: 'https://youtube.com.evil.test/watch?v=fRIhCiUVaKs' }), artwork.placeholder)
  assert.equal(artwork.url({ info: {}, pluginInfo: { artworkUrl: 'https://cdn.example.com/cover.jpg' } }), 'https://cdn.example.com/cover.jpg')
  assert.equal(artwork.url({ artworkUrl: 'javascript:alert(1)' }), artwork.placeholder)
})
test('failed cover stays visible as fallback until the next song changes its source', () => {
  const image = { dataset: {} }
  artwork.set(image, { artworkUrl: 'https://cdn.example.com/first.jpg' }, 'First')
  image.onerror()
  artwork.set(image, { artworkUrl: 'https://cdn.example.com/first.jpg' }, 'First')
  assert.equal(image.src, artwork.placeholder)
  artwork.set(image, { artworkUrl: 'https://cdn.example.com/second.jpg' }, 'Second')
  assert.equal(image.src, 'https://cdn.example.com/second.jpg')
  assert.equal(image.alt, 'Second')
})
