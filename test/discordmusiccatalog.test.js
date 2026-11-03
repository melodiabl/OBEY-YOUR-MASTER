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

test('a track title match is not discarded when an artist has the same name as the query', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const track = (title, author, id) => ({ info: { title, author, uri: 'https://example.com/' + id, sourceName: 'spotify' } })
  const results = rankMusicTracks([track('Other song', 'Hello', 'a'), track('Another song', 'Hello', 'b'), track('Hello', 'Adele', 'c'), track('Hello', 'Lionel Richie', 'd')], 'Hello')
  assert.equal(results[0].info.title, 'Hello')
  assert.deepEqual(results.slice(0, 2).map(t => t.info.author), ['Adele', 'Lionel Richie'])
  assert.ok(results.some(t => t.info.author === 'Hello'), 'artist matches remain discoverable without displacing title matches')
})

test('partial, accented and combined title searches favor song evidence over author-only hits', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const track = (title, author, id) => ({ info: { title, author, uri: 'https://example.com/' + id, sourceName: 'spotify' } })
  for (const [query, correct] of [['Titanium', track('Titanium (feat. Sia)', 'David Guetta', 't')], ['corazon partio', track('Corazón Partío (Official Video)', 'Alejandro Sanz', 's')], ['Hello Adele', track('Hello', 'Adele', 'h')], ['Adele Hello', track('Hello', 'Adele', 'h2')]]) {
    const unrelated = [track('Unrelated one', query, 'a'), track('Unrelated two', query, 'b')]
    const results = rankMusicTracks([...unrelated, correct], query)
    assert.equal(results[0], correct, query)
  }
})

test('an album title remains searchable even if track results identify a homonymous artist', async t => {
  const http = require('node:http')
  t.mock.method(http, 'get', (_url, _options, callback) => {
    const request = new (require('node:events').EventEmitter)(); request.destroy = () => {}
    queueMicrotask(() => callback({ statusCode: 404, resume() {} })); return request
  })
  const album = { type: 'album', title: 'Discovery', author: 'Daft Punk', uri: 'https://open.spotify.com/album/1111111111111111111111', totalTracks: 14 }
  const client = { music: { search: async () => ({ tracks: [{ info: { title: 'One', author: 'Discovery' } }, { info: { title: 'Two', author: 'Discovery' } }], albums: [album] }) } }
  const result = await searchDiscordCatalog(client, 'Discovery')
  assert.deepEqual(result.albums, [album])
})

test('YouTube artist prefixes do not turn a catalog artist search into uploader title matches', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const official = { info: { title: 'Hello', author: 'Adele', sourceName: 'spotify', uri: 'https://open.spotify.com/track/1111111111111111111111' } }
  const upload = { info: { title: 'Adele - Hello (Lyrics)', author: 'Music Channel', sourceName: 'youtube', uri: 'https://www.youtube.com/watch?v=11111111111' } }
  assert.equal(rankMusicTracks([upload, official], 'Adele')[0], official)
  assert.equal(rankMusicTracks([upload, official], 'Hello')[0], official)
})

test('whole-title matches ignore spacing differences without becoming artist-only matches', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const track = { info: { title: 'Starboy', author: 'The Weeknd', sourceName: 'spotify' } }
  assert.equal(rankMusicTracks([track], 'star boy')[0], track)
})

test('catalog search retains title matches and albums and does not implicitly open an artist top', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const uri = 'https://open.spotify.com/artist/1111111111111111111111'
  const track = (title, author, id) => ({ info: { title, author, sourceName: 'spotify', uri: 'https://example.com/' + id } })
  const queries = []
  const node = { name: 'node', rest: {
    resolve: async query => { queries.push(query); return { loadType: 'search', data: [track('Other song', 'Hello', 'a'), track('Another song', 'Hello', 'b'), track('Hello', 'Adele', 'c')] } },
    fetch: async () => ({ artists: [{ info: { name: 'Hello' }, pluginInfo: { url: uri, author: 'Hello' } }], albums: [{ info: { name: 'Hello' }, pluginInfo: { url: 'https://open.spotify.com/album/2222222222222222222222', author: 'Other artist', totalTracks: 10 } }] }),
  } }
  const result = await searchCatalogNodes({}, [node], 'Hello')
  assert.equal(result.tracks[0].info.author, 'Adele')
  assert.equal(result.albums[0].author, 'Other artist')
  assert.equal(result.artists[0].title, 'Hello')
  assert.equal(queries.some(query => query.startsWith('https:')), false)
})

test('album-name search can use catalog track metadata without LavaSearch', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const uri = 'https://open.spotify.com/album/1111111111111111111111'
  const node = { name: 'node', rest: { resolve: async () => ({ loadType: 'search', data: [{ info: { title: 'One More Time', author: 'Daft Punk', sourceName: 'spotify' }, pluginInfo: { albumName: 'Discovery', albumUrl: uri } }] }) } }
  const result = await searchCatalogNodes({}, [node], 'Discovery')
  assert.equal(result.albums[0].title, 'Discovery')
  assert.equal(result.albums[0].uri, uri)
  assert.equal(result.tracks.length, 0)
})

test('query intent uses exact names independently, preferring song titles over homonymous artists', () => {
  const { preferredCatalogTab } = require('../handlers/music/recordings')
  const result = { tracks: [{ info: { title: 'Hello', author: 'Adele' } }, { info: { title: 'Other song', author: 'Discovery' } }], albums: [{ title: 'Discovery', author: 'Daft Punk' }], artists: [{ title: 'Adele' }, { title: 'Hello' }, { title: 'Discovery' }] }
  assert.equal(preferredCatalogTab(result, 'Hello'), 'tracks')
  assert.equal(preferredCatalogTab(result, 'Discovery'), 'albums')
  assert.equal(preferredCatalogTab(result, 'Adele'), 'artists')
  assert.equal(preferredCatalogTab(result, 'Hello Adele'), 'tracks')
  assert.equal(preferredCatalogTab(result, 'Discovery Daft Punk'), 'albums')
  assert.equal(preferredCatalogTab(result, 'Daft Punk Discovery'), 'albums')
})

test('partial title words remain searchable without requiring an exact artist word', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const song = { info: { title: 'Titanium', author: 'David Guetta', sourceName: 'spotify' } }
  assert.equal(rankMusicTracks([song], 'titani')[0], song)
})

test('a title and credited artist query outranks covers that put the artist inside the title', () => {
  const { rankMusicTracks } = require('../handlers/music/recordings')
  const song = { info: { title: 'Hello', author: 'Adele', sourceName: 'spotify' } }
  const cover = { info: { title: 'Hello (Adele)', author: 'PelleK', sourceName: 'applemusic' } }
  const namesake = { info: { title: 'Hello Adele', author: 'Zen Gnarly', sourceName: 'applemusic' } }
  assert.equal(rankMusicTracks([cover, namesake, song], 'Hello Adele')[0], song)
  assert.equal(rankMusicTracks([cover, namesake, song], 'Adele Hello')[0], song)
  assert.equal(rankMusicTracks([cover, namesake, song], 'Hello')[0], song)
})

test('Discord opens the preferred category while keeping the other search tabs available', async () => {
  const { EventEmitter } = require('node:events')
  const { openCatalogPicker } = require('../handlers/music/catalog-picker')
  for (const preferredTab of ['albums', 'artists']) {
    const collector = new EventEmitter(), renders = []
    const results = { preferredTab, tracks: [{ info: { title: 'Song', author: 'Artist' } }],
      albums: [{ type: 'album', title: 'Discovery', author: 'Daft Punk', uri: 'https://open.spotify.com/album/1111111111111111111111' }],
      artists: [{ type: 'artist', title: 'Adele', author: 'Adele', uri: 'https://open.spotify.com/artist/2222222222222222222222' }] }
    await openCatalogPicker({ client: {}, query: preferredTab === 'albums' ? 'Discovery' : 'Adele', results,
      actor: { id: 'owner' }, guild: { id: 'guild' }, edit: async payload => { renders.push(payload); return { createMessageComponentCollector: () => collector } } })
    assert.match(renders[0].embeds[0].toJSON().title, preferredTab === 'albums' ? /Álbumes/ : /Artistas/)
    assert.ok(renders[0].components.flatMap(row => row.toJSON().components).some(button => button.custom_id === 'srch_tab:tracks'))
  }
})

test('the web player highlights the preferred category without losing other result kinds', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../dashboard/views/pages/player.ejs'), 'utf8')
  const code = source.match(/function resultItems\(catalog, kind\) \{[\s\S]*?\n\}/)[0]
  const items = require('node:vm').runInNewContext(code + '\nresultItems')
  const catalog = { tracks: [{ title: 'Song' }], albums: [{ title: 'Discovery' }], artists: [{ title: 'Adele' }], preferredTab: 'albums' }
  assert.equal(items(catalog, 'all')[0].title, 'Discovery')
  assert.equal(items(catalog, 'all').length, 3)
  assert.equal(items(catalog, 'tracks')[0].title, 'Song')
  assert.equal(items({ ...catalog, preferredTab: 'artists' }, 'all')[0].title, 'Adele')
})
