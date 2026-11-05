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

test('artists are queried as native resources independently from track matches', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const queries = [], uri = 'https://music.apple.com/us/artist/1765924916'
  const node = { name: 'public', native: { isNodeLink: true }, rest: { resolve: async query => {
    queries.push(query)
    return { loadType: 'search', data: [{ info: { title: 'Another Adela Project', uri: 'https://music.apple.com/us/artist/1492375901', sourceName: 'applemusic' }, pluginInfo: { type: 'artist' } }, { info: { title: 'ADÉLA', author: 'Apple Music', uri, sourceName: 'applemusic' }, pluginInfo: { type: 'artist' } }] }
  } } }
  const result = await searchCatalogNodes({}, [node], 'Adela', undefined, { kind: 'artists', source: 'applemusic' })
  assert.deepEqual(queries, ['amsearch:artist:Adela'])
  assert.equal(result.artists[0].uri, uri)
  assert.equal(result.statuses.artists, 'ready')
  assert.equal(result.tracks.length, 0)
})

test('native album search retains real track counts and canonical album identities', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const node = { name: 'public', native: { isNodeLink: true }, rest: { resolve: async query => {
    assert.equal(query, 'amsearch:album:Discovery Daft Punk')
    return { loadType: 'search', data: ['discovery', 'one-more-time'].map(slug => ({ info: { title: 'Discovery', author: 'Daft Punk', sourceName: 'applemusic', uri: `https://music.apple.com/us/album/${slug}/697194953` }, pluginInfo: { type: 'album', trackCount: 14 } })) }
  } } }
  const result = await searchCatalogNodes({}, [node], 'Discovery Daft Punk', undefined, { kind: 'albums', source: 'applemusic' })
  assert.equal(result.albums.length, 1)
  assert.equal(result.albums[0].uri, 'https://music.apple.com/us/album/697194953')
  assert.equal(result.albums[0].totalTracks, 14)
})

test('Lavalink metadata queries use the selected source and exact LavaSearch type', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const node = { name: 'java', rest: { resolve: async () => assert.fail('metadata must not use track queries'), fetch: async request => {
    assert.deepEqual(request.options.params, { query: 'amsearch:Discovery', types: 'album' })
    return { albums: [{ info: { name: 'Discovery' }, pluginInfo: { author: 'Daft Punk', url: 'https://music.apple.com/us/album/697194953', totalTracks: 14 } }] }
  } } }
  const result = await searchCatalogNodes({}, [node], 'Discovery', undefined, { kind: 'albums', source: 'applemusic' })
  assert.equal(result.albums[0].sourceName, 'applemusic')
})

test('an explicit provider failure is not silently replaced by another platform', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const calls = [], client = { nyxlink: { search: async options => { calls.push(options.source); return { loadType: 'error', tracks: [] } } } }
  const result = await searchCatalogNodes(client, [{ name: 'public' }], 'Hello', undefined, { kind: 'tracks', source: 'spotify' })
  assert.deepEqual(calls, ['spsearch'])
  assert.equal(result.statuses.tracks, 'unavailable')
  assert.equal(result.tracks.length, 0)
})

test('automatic track search uses the native client and stops after a successful catalog', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const calls = [], client = { nyxlink: { search: async options => {
    calls.push(options.source)
    return options.source === 'spsearch' ? { loadType: 'error', tracks: [] } : { loadType: 'search', tracks: [{ ...song('hello', 'Hello'), info: { ...song('hello', 'Hello').info, sourceName: 'applemusic' } }] }
  } } }
  const result = await searchCatalogNodes(client, [{ name: 'public' }], 'Hello', undefined, { kind: 'tracks', source: 'auto' })
  assert.deepEqual(calls, ['spsearch', 'amsearch'])
  assert.equal(result.sources.tracks, 'applemusic')
  assert.equal(result.tracks[0].info.title, 'Hello')
})

test('cache isolation preserves category, platform and backend session', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const queries = [], client = { nyxlink: { search: async options => { queries.push(options.source); return { loadType: 'empty', tracks: [] } } } }
  const node = { name: 'public', sessionId: 'one', native: { isNodeLink: true }, rest: { resolve: async q => { queries.push(q); return { loadType: 'empty', data: {} } } } }
  for (const context of [{ kind: 'tracks', source: 'spotify' }, { kind: 'artists', source: 'spotify' }, { kind: 'tracks', source: 'spotify' }, { kind: 'tracks', source: 'applemusic' }]) await searchCatalogNodes(client, [node], 'Adela', undefined, context)
  node.sessionId = 'two'
  await searchCatalogNodes(client, [node], 'Adela', undefined, { kind: 'tracks', source: 'spotify' })
  assert.deepEqual(queries, ['spsearch', 'spsearch:artist:Adela', 'amsearch', 'spsearch'])
})

test('unsupported artist platforms and empty catalog results have distinct statuses', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  let calls = 0
  const node = { name: 'public', native: { isNodeLink: true }, rest: { resolve: async () => { calls++; return { loadType: 'empty', data: {} } } } }
  const empty = await searchCatalogNodes({}, [node], 'Unknown', undefined, { kind: 'artists', source: 'applemusic' })
  const unsupported = await searchCatalogNodes({}, [node], 'Unknown', undefined, { kind: 'artists', source: 'youtube' })
  assert.equal(empty.statuses.artists, 'empty')
  assert.equal(unsupported.statuses.artists, 'unsupported')
  assert.equal(calls, 1)
})

test('URL previews do not pin or penalize audio nodes on catalog failure', async () => {
  const node = { name: 'public', rest: { resolve: async () => ({ loadType: 'error', data: {} }) } }
  let pins = 0, penalties = 0
  await assert.rejects(searchNodes({ nodePool: { candidates: () => [node], pin: () => pins++, fail: () => penalties++ } }, album, 'Tester', { guildId: 'guild' }))
  assert.equal(pins, 0)
  assert.equal(penalties, 0)
})

test('a responsive node wins without waiting for or retaining a slower catalog request', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  let aborted = false, timer
  const client = { nyxlink: { search: options => options.node === 'slow'
    ? new Promise((_, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(Error('cancelled')) }, { once: true }))
    : Promise.resolve({ loadType: 'search', tracks: [song('hello', 'Hello')] }) } }
  try {
    const result = await Promise.race([searchCatalogNodes(client, [{ name: 'slow' }, { name: 'fast' }], 'Hello', undefined, { kind: 'tracks', source: 'spotify' }), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Responsive catalog was blocked')), 1000) })])
    assert.equal(result.tracks[0]._resolvedNode, 'fast')
    assert.equal(aborted, true)
  } finally { clearTimeout(timer) }
})

test('cached catalog results attach each requester without leaking another listener identity', async () => {
  const node = { name: 'public' }; let requests = 0
  const client = { nodePool: { candidates: () => [node] }, nyxlink: { search: async () => { requests++; return { loadType: 'search', tracks: [song('hello', 'Hello')] } } } }
  const alice = await searchNodes(client, 'Hello', { id: 'alice', username: 'Alice' }, { source: 'spotify' })
  const bob = await searchNodes(client, 'Hello', { id: 'bob', username: 'Bob' }, { source: 'spotify' })
  assert.equal(requests, 1)
  assert.equal(alice.tracks[0].info.requesterId, 'alice')
  assert.equal(bob.tracks[0].info.requesterId, 'bob')
})
