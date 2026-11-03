const assert = require('node:assert/strict')
const test = require('node:test')

const {
  enqueueCatalogItem,
  searchDiscordCatalog,
  toQueueTrack,
} = require('../handlers/discordmusiccatalog')

test('searchDiscordCatalog returns Lavalink tracks via client.music.search', async t => {
  // The optional legacy album catalog is an external HTTP boundary.
  t.mock.method(require('node:http'), 'get', (_url, _options, onResponse) => {
    const request = new (require('node:events').EventEmitter)()
    request.destroy = () => {}
    queueMicrotask(() => onResponse({ statusCode: 404, resume() {} }))
    return request
  })
  let receivedQuery
  const tracks = Array.from({ length: 25 }, (_, i) => ({
    encoded: `t${i}`,
    info: { title: `Item ${i}`, author: 'Artist', uri: `u${i}` },
  }))
  const client = {
    music: {
      search: async query => {
        receivedQuery = query
        return { loadType: 'search', tracks }
      },
    },
  }

  const result = await searchDiscordCatalog(client, 'query')

  assert.equal(receivedQuery, 'query')
  assert.equal(result.tracks.length, 20)
  assert.equal(result.tracks[0].encoded, 't0')
  assert.deepEqual(result.playlists, [])
})

test('toQueueTrack keeps metadata and stays without encoded for lazy resolution', () => {
  const track = toQueueTrack({
    title: 'Song',
    author: 'Artist',
    uri: 'https://open.spotify.com/track/1',
    sourceName: 'spotify',
    isrc: 'TEST12345678',
  }, { username: 'Tester' })

  assert.equal(track.info.sourceName, 'spotify')
  assert.equal(track.info.isrc, 'TEST12345678')
  assert.equal(track.info.requester, 'Tester')
  assert.equal(track.encoded, undefined)
})

test('selecting a collection queues all of its resolved tracks', async () => {
  const state = { currentTrack: null, queue: [] }
  let played = false
  const client = {
    music: {
      joinChannel: async () => ({ id: 'player' }),
      getState: () => state,
      search: async () => ({
        loadType: 'playlist',
        tracks: [
          { encoded: 'e1', info: { title: 'One', author: 'Artist', uri: 'u1', isrc: 'ONE' } },
          { encoded: 'e2', info: { title: 'Two', author: 'Artist', uri: 'u2', isrc: 'TWO' } },
        ],
      }),
      playCollection: async (_, _voice, _text, tracks) => { state.queue.push(...tracks); played = true },
    },
  }
  const message = {
    guild: { id: '123456789012345678' },
    channel: { id: '323456789012345678' },
    author: { username: 'Tester' },
  }

  const result = await enqueueCatalogItem(client, message, { id: '223456789012345678' }, {
    type: 'playlist',
    title: 'Playlist',
    uri: 'https://open.spotify.com/playlist/1',
  })

  assert.equal(result.added, 2)
  assert.equal(state.queue.length, 2)
  assert.equal(state.queue[0].info.isrc, 'ONE')
  assert.equal(played, true)
})

test('a real Lavalink track is queued as-is with the requester set', async () => {
  const state = { currentTrack: { info: {} }, queue: [] }
  const client = {
    music: {
      joinChannel: async () => ({ id: 'player' }),
      getState: () => state,
      search: async () => { throw new Error('should not search for encoded tracks') },
      playCollection: async (_, _voice, _text, tracks) => { state.queue.push(...tracks) },
    },
  }
  const message = { guild: { id: '123456789012345678' }, channel: { id: '323456789012345678' }, author: { username: 'Tester' } }

  const result = await enqueueCatalogItem(client, message, { id: '223456789012345678' }, {
    encoded: 'real',
    info: { title: 'Song', author: 'Artist', uri: 'u' },
  })

  assert.equal(result.added, 1)
  assert.equal(result.isNow, false)
  assert.equal(state.queue[0].encoded, 'real')
  assert.equal(state.queue[0].info.requester, 'Tester')
})

test('artist identities come from catalog URLs and keep homonymous artists separate', () => {
  const { artistsFromTracks } = require('../handlers/music/artists')
  const make = (artistUrl, author = 'Adela') => ({ info: { author, sourceName: 'spotify' }, pluginInfo: { artistUrl } })
  const one = 'https://open.spotify.com/artist/1111111111111111111111'
  const two = 'https://open.spotify.com/artist/2222222222222222222222'
  const result = artistsFromTracks([make(one), make(one), make(two), make('https://evil.invalid/artist/abc')], 'Adela')
  assert.deepEqual(result.map(x => x.uri), [one, two])
  assert.equal(result.every(x => x.type === 'artist' && x.title === 'Adela'), true)
})

test('artist profile preserves provider top order, returns albums, and never enqueues', async () => {
  const { getArtist } = require('../handlers/music/artists')
  const uri = 'https://open.spotify.com/artist/1111111111111111111111'
  const track = (id, title) => ({ encoded: id, info: { title, author: 'Adela', uri: 'https://open.spotify.com/track/' + id.padEnd(22, '0'), sourceName: 'spotify', length: 180000 }, pluginInfo: { albumName: 'Album', albumUrl: 'https://open.spotify.com/album/3333333333333333333333', artistUrl: uri } })
  let plays = 0
  const node = { name: 'working', rest: { resolve: async q => { assert.equal(q, uri); return { loadType: 'playlist', data: { info: { name: 'Adela top tracks' }, pluginInfo: { type: 'artist', url: uri, author: 'Adela' }, tracks: [track('second', 'Second'), track('first', 'First')] } } } } }
  const client = { nodePool: { candidates: () => [node] }, music: { enqueue: () => { plays++ } } }
  const profile = await getArtist(client, uri)
  assert.deepEqual(profile.tracks.map(t => t.info.title), ['Second', 'First'])
  assert.equal(profile.artist.title, 'Adela')
  assert.equal(profile.albums.length, 1)
  assert.equal(profile.ranking, 'provider-top')
  assert.equal(plays, 0)
})

test('artist profiles reject arbitrary URLs before contacting any node', async () => {
  const { getArtist } = require('../handlers/music/artists')
  let queries = 0
  const client = { nodePool: { candidates: () => { queries++; return [] } } }
  for (const uri of ['http://127.0.0.1/private', 'https://open.spotify.com.evil.invalid/artist/1111111111111111111111', 'https://open.spotify.com/track/1111111111111111111111']) await assert.rejects(getArtist(client, uri), { code: 'invalid_artist' })
  assert.equal(queries, 0)
})

test('an artist selection opens top tracks and returns to artists without starting playback', async () => {
  const { EventEmitter } = require('node:events')
  const { openCatalogPicker } = require('../handlers/music/catalog-picker')
  const uri = 'https://open.spotify.com/artist/1111111111111111111111'
  const collector = new EventEmitter(); collector.stop = reason => collector.emit('end', [], reason)
  const renders = []; let enqueues = 0
  const client = { nodePool: { candidates: () => [{ name: 'node', rest: { resolve: async () => ({ loadType: 'playlist', data: { pluginInfo: { type: 'artist', url: uri, author: 'Adela' }, tracks: [{ encoded: 'a', info: { title: 'Top song', author: 'Adela', sourceName: 'spotify', uri: 'https://open.spotify.com/track/2222222222222222222222' } }] } }) } }] }, music: { enqueue: () => enqueues++ } }
  await openCatalogPicker({ client, query: 'Adela', results: { tracks: [], albums: [], artists: [{ type: 'artist', title: 'Adela', uri }] }, actor: { id: 'owner' }, guild: { id: 'guild' }, prefix: 'artist', edit: async payload => { renders.push(payload); return { createMessageComponentCollector: () => collector } } })
  const interact = collector.listeners('collect')[0]
  const event = id => ({ customId: id, values: ['0'], user: { id: 'owner' }, deferUpdate: async () => {}, followUp: async () => {} })
  await interact(event('artist_pick'))
  assert.match(renders.at(-1).embeds[0].toJSON().title, /populares/)
  assert.ok(renders.at(-1).components.flatMap(row => row.toJSON().components).some(x => x.custom_id === 'artist_artists-back'))
  assert.equal(enqueues, 0)
  await interact(event('artist_artists-back'))
  assert.match(renders.at(-1).embeds[0].toJSON().title, /Artistas/)
  assert.equal(enqueues, 0)
})

test('NodeLink artist collections with native top-track metadata remain browsable', async () => {
  const { getArtist } = require('../handlers/music/artists')
  const uri = 'https://open.spotify.com/artist/1111111111111111111111'
  const client = { nodePool: { candidates: () => [{ name: 'nodelink', native: { isNodeLink: true }, rest: { resolve: async () => ({ loadType: 'playlist', data: { info: { name: "Adela's Top Tracks" }, pluginInfo: {}, tracks: [{ encoded: 'a', info: { title: 'Song', author: 'Adela', sourceName: 'spotify', uri: 'https://open.spotify.com/track/2222222222222222222222' } }] } }) } }] } }
  const result = await getArtist(client, uri)
  assert.equal(result.artist.title, 'Adela')
  assert.equal(result.ranking, 'provider-top')
})

test('Stop invalidates a pending catalog collection even when its state object is retained', async () => {
  let release, entered
  const ready = new Promise(resolve => { entered = resolve }), waiting = new Promise(resolve => { release = resolve })
  const state = { currentTrack: null, stopRequestEpoch: 0, stopRequested: false }
  let enqueues = 0
  const client = { music: { getState: () => state, search: async () => { entered(); await waiting; return { tracks: [{ encoded: 'song', info: { title: 'Song' } }] } }, playCollection: async () => { enqueues++ } } }
  const pending = enqueueCatalogItem(client, { guild: { id: 'guild' }, author: { id: 'actor' }, channel: { id: 'text' } }, { id: 'voice' }, { type: 'album', uri: 'https://open.spotify.com/album/1111111111111111111111' })
  const observed = pending.catch(() => {})
  await ready; state.stopRequestEpoch++; release()
  await assert.rejects(pending, /cancel/)
  await observed
  assert.equal(enqueues, 0)
})

test('missing album names in artist tops are resolved from the real album identity', async () => {
  const { getArtist } = require('../handlers/music/artists')
  const uri = 'https://open.spotify.com/artist/1111111111111111111111', album = 'https://open.spotify.com/album/3333333333333333333333'
  const client = { nodePool: { candidates: () => [{ name: 'node', rest: { resolve: async query => query === album
    ? { loadType: 'playlist', data: { info: { name: '21' }, pluginInfo: { type: 'album', url: album, author: 'Adele', totalTracks: 11 }, tracks: [] } }
    : { loadType: 'playlist', data: { pluginInfo: { type: 'artist', url: uri, author: 'Adele' }, tracks: [{ encoded: 'a', info: { title: 'Song', author: 'Adele', sourceName: 'spotify' }, pluginInfo: { albumUrl: album, albumName: null } }] } } } }] } }
  const profile = await getArtist(client, uri)
  assert.equal(profile.albums[0].title, '21')
  assert.equal(profile.albums[0].totalTracks, 11)
})
