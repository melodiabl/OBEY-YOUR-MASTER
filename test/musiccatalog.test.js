const assert = require('node:assert/strict')
const test = require('node:test')
const { searchDiscordCatalog } = require('../handlers/discordmusiccatalog')
const { searchNodes, trackOnNode } = require('../handlers/music/node-search')
const { normalizePublicTrack, tracksFromResolve } = require('../handlers/music/utils')

const album = 'https://open.spotify.com/album/1111111111111111111111'
const song = (id, title, isrc = id) => ({ encoded: id, info: { title, author: 'Artist', sourceName: 'spotify', uri: 'https://open.spotify.com/track/' + id.padEnd(22, '0'), length: 180000, isrc } })

test('public node metadata preserves album, release date, ISRC and duration without encoded internals', () => {
  const result = normalizePublicTrack({ ...song('one', 'Song'), _resolvedNode: 'internal', pluginInfo: { albumName: 'Album', releaseDate: '2026-06-08', isrc: 'ONE' } })
  assert.equal(result.title, 'Song')
  assert.equal(result.albumName, 'Album')
  assert.equal(result.releaseDate, '2026-06-08')
  assert.equal(result.isrc, 'one')
  assert.equal(result.length, 180000)
  assert.equal(result.encoded, undefined)
  assert.equal(result._resolvedNode, undefined)
})

test('catalog search returns node albums without calling a separate HTTP catalog', async t => {
  t.mock.method(require('node:http'), 'get', () => { assert.fail('A separate HTTP catalog must not be contacted') })
  const nativeAlbum = { type: 'album', title: 'Discovery', author: 'Daft Punk', uri: album, sourceName: 'spotify', totalTracks: 14 }
  const client = { music: { search: async (_query, _requester, context) => { assert.equal(context.multiple, true); return { tracks: [], albums: [nativeAlbum] } } } }
  const result = await searchDiscordCatalog(client, 'Discovery')
  assert.deepEqual(result.albums, [nativeAlbum])
})

test('missing node results do not trigger a legacy HTTP fallback', async t => {
  t.mock.method(require('node:http'), 'get', () => { assert.fail('A legacy HTTP fallback must not be contacted') })
  const result = await searchDiscordCatalog({ music: { search: async () => ({ tracks: [], albums: [], artists: [] }) } }, 'Unknown')
  assert.deepEqual(result.tracks, [])
  assert.deepEqual(result.albums, [])
  assert.deepEqual(result.artists, [])
})

test('Spotify album previews resolve complete collections through the public node', async () => {
  const tracks = [song('one', 'One'), song('two', 'Two')]
  const node = { name: 'public', rest: { resolve: async query => { assert.equal(query, album); return { loadType: 'playlist', data: { info: { name: 'Album' }, tracks } } } } }
  const result = await searchNodes({ nodePool: { candidates: () => [node] } }, album, 'Tester')
  assert.equal(result.loadType, 'playlist')
  assert.equal(result.playlistName, 'Album')
  assert.equal(result.tracks.length, 2)
  assert.equal(result.tracks[0].info.isrc, 'one')
  assert.equal(result.tracks[1]._resolvedNode, 'public')
})

test('native album collections retain their tracks and normalize to the public playlist contract', async () => {
  const track = song('one', 'One')
  const node = { name: 'public', rest: { resolve: async () => ({ loadType: 'album', data: { info: { name: 'Album' }, tracks: [track] } }) } }
  const result = await searchNodes({ nodePool: { candidates: () => [node] } }, album, 'Tester')
  assert.equal(result.loadType, 'playlist')
  assert.equal(result.tracks[0].encoded, 'one')
  assert.deepEqual(tracksFromResolve({ loadType: 'error', data: {} }), [])
})

test('cross-node playback matching rejects another recording and preserves requester metadata', async () => {
  const original = { ...song('original', 'Song', 'MATCH'), _resolvedNode: 'previous' }
  original.info.requesterId = 'listener'
  const node = { name: 'backup', rest: { resolve: async () => ({ loadType: 'search', data: [song('wrong', 'Song', 'DIFFERENT'), song('fresh', 'Song', 'MATCH')] }) } }
  const result = await trackOnNode(original, node)
  assert.equal(result.encoded, 'fresh')
  assert.equal(result._resolvedNode, 'backup')
  assert.equal(result.info.requesterId, 'listener')
})
