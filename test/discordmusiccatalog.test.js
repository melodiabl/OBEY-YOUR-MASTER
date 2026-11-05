const assert = require('node:assert/strict')
const test = require('node:test')

test('prefix playback commands report failed actions instead of a false success', async () => {
  for (const action of ['pause', 'resume', 'skip', 'stop']) {
    const replies = [], state = { currentTrack: { info: { title: 'Current' } }, queue: [], paused: action === 'resume' }
    const context = { guild: { id: 'guild' }, member: { voice: { channel: { id: 'voice' } } }, reply: async payload => {
      replies.push(payload)
      return { edit: async next => { replies.push(next) } }
    } }
    const fail = async () => { throw Error('backend unavailable') }
    const client = { settings: { get: () => 'es' }, music: { getState: () => state, pause: fail, skip: fail, stop: fail } }
    await require('../commands/Music/' + action).run(client, context, [])
    const embed = replies.at(-1).embeds[0].toJSON()
    assert.equal(embed.color, 0xED4245, action)
    assert.match(embed.description, /No pude confirmar/, action)
    assert.doesNotMatch(embed.description, /backend unavailable/, action)
  }
})

test('prefix and slash pause/resume request the same explicit playback state', async () => {
  for (const slash of [false, true]) for (const action of ['pause', 'resume']) {
    const calls = [], state = { currentTrack: { info: { title: 'Current' } }, queue: [], paused: action === 'pause' }
    const context = { guild: { id: 'guild' }, member: { voice: { channel: { id: 'voice' } } },
      reply: async () => ({ edit: async () => {} }), deferReply: async () => {}, editReply: async () => {} }
    const client = { settings: { get: () => 'es' }, music: { getState: () => state, pause: async (id, paused) => { calls.push([id, paused]); return paused } } }
    await require('../' + (slash ? 'slashCommands' : 'commands') + '/Music/' + action).run(client, context, [])
    assert.deepEqual(calls, [['guild', action === 'pause']])
  }
})

test('slash batch skip invokes one operation and propagates an English failure', async () => {
  const calls = [], replies = []
  const client = { settings: { get: () => 'en' }, music: { getState: () => ({ currentTrack: { title: 'Current' }, queue: [{}, {}, {}] }), skip: async (...args) => { calls.push(args); throw Error('private backend detail') } } }
  const context = { guild: { id: 'guild' }, member: { voice: { channel: { id: 'voice' } } }, options: { getInteger: () => 3 }, deferReply: async () => {}, editReply: async payload => replies.push(payload) }
  await require('../slashCommands/Music/skip').run(client, context)
  assert.deepEqual(calls, [['guild', 3]])
  const embed = replies.at(-1).embeds[0].toJSON()
  assert.equal(embed.color, 0xED4245)
  assert.match(embed.description, /could not confirm/i)
})

test('Stop can cancel loading before a song exists and reports pending persistence', async () => {
  const replies = []; let stops = 0
  const command = require('../slashCommands/Music/stop')
  assert.equal(command.parameters.activeplayer, false)
  const client = { settings: { get: (_id, key) => key === 'MUSIC' ? false : 'es' }, music: { getState: () => ({ currentTrack: null, queue: [] }), stop: async () => { stops++; return { stopped: true, persisted: false } } } }
  await command.run(client, { guild: { id: 'guild' }, member: { voice: { channel: {} } }, deferReply: async () => {}, editReply: async payload => replies.push(payload) })
  assert.equal(stops, 1)
  assert.match(replies.at(-1).embeds[0].toJSON().description, /guardado.*pendiente/)
})

test('invalid skip counts are rejected before executing a playback action', async () => {
  let skips = 0
  const replies = [], client = { settings: { get: () => 'es' }, music: { getState: () => ({ currentTrack: {}, queue: [] }), skip: async () => { skips++ } } }
  await require('../commands/Music/skip').run(client, { guild: { id: 'guild' }, member: { voice: { channel: {} } }, reply: async () => ({ edit: async payload => replies.push(payload) }) }, ['500'])
  assert.equal(skips, 0)
  assert.equal(replies.at(-1).embeds[0].toJSON().color, 0xED4245)
})

const {
  enqueueCatalogItem,
  searchDiscordCatalog,
  toQueueTrack,
} = require('../handlers/discordmusiccatalog')

test('searchDiscordCatalog returns Lavalink tracks via client.music.search', async () => {
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

test('artist identities come from catalog URLs and keep homonymous artists separate', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const make = uri => ({ info: { title: 'Adela', uri, sourceName: 'spotify' }, pluginInfo: { type: 'artist' } })
  const one = 'https://open.spotify.com/artist/1111111111111111111111'
  const two = 'https://open.spotify.com/artist/2222222222222222222222'
  const node = { name: 'public', native: { isNodeLink: true }, rest: { resolve: async () => ({ loadType: 'search', data: [make(one), make(one), make(two), make('https://evil.invalid/artist/abc')] }) } }
  const result = await searchCatalogNodes({}, [node], 'Adela', undefined, { kind: 'artists', source: 'spotify' })
  assert.deepEqual(result.artists.map(x => x.uri), [one, two])
  assert.equal(result.artists.every(x => x.type === 'artist' && x.title === 'Adela'), true)
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

test('an album title remains searchable even if track results identify a homonymous artist', async () => {
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
  const client = { nyxlink: { search: async options => { queries.push(options.query); return { loadType: 'search', tracks: [track('Other song', 'Hello', 'a'), track('Another song', 'Hello', 'b'), track('Hello', 'Adele', 'c')] } } } }
  const result = await searchCatalogNodes(client, [node], 'Hello')
  assert.equal(result.tracks[0].info.author, 'Adele')
  assert.equal(result.albums[0].author, 'Other artist')
  assert.equal(result.artists[0].title, 'Hello')
  assert.equal(queries.some(query => query.startsWith('https:')), false)
})

test('album-name search uses the native album category without depending on track titles', async () => {
  const { searchCatalogNodes } = require('../handlers/music/catalog-search')
  const uri = 'https://open.spotify.com/album/1111111111111111111111'
  const node = { name: 'node', native: { isNodeLink: true }, rest: { resolve: async query => { assert.equal(query, 'spsearch:album:Discovery'); return { loadType: 'search', data: [{ info: { title: 'Discovery', author: 'Daft Punk', sourceName: 'spotify', uri }, pluginInfo: { type: 'album' } }] } } } }
  const result = await searchCatalogNodes({}, [node], 'Discovery', undefined, { kind: 'albums', source: 'spotify' })
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

test('Apple Music artist identity ignores its optional display slug while retaining region and ID', () => {
  const { artistUri } = require('../handlers/music/artists')
  assert.equal(artistUri('https://music.apple.com/us/artist/adele/262836961'), 'https://music.apple.com/us/artist/262836961')
  assert.equal(artistUri('https://music.apple.com/us/artist/ad%C3%A9la/1765924916'), 'https://music.apple.com/us/artist/1765924916')
  assert.notEqual(artistUri('https://music.apple.com/us/artist/262836961'), artistUri('https://music.apple.com/us/artist/1765924916'))
  assert.notEqual(artistUri('https://music.apple.com/us/artist/262836961'), artistUri('https://music.apple.com/es/artist/262836961'))
})

test('artist tab and selection open native NodeLink Apple Music tops without enqueuing', async () => {
  const { EventEmitter } = require('node:events'), { nodeView } = require('../handlers/music/node-view')
  const { openCatalogPicker } = require('../handlers/music/catalog-picker')
  const collector = new EventEmitter(), renders = [], queries = []
  const track = { encoded: 'top', info: { title: 'Someone Like You', author: 'Adele', sourceName: 'applemusic', uri: 'https://music.apple.com/us/song/420075084' } }
  const native = { identifier: 'native', isNodeLink: true, rest: { loadTracks: async query => {
    queries.push(query)
    // NodeLink's Apple URL matcher requires a display segment before the ID.
    if (query !== 'https://music.apple.com/us/artist/_/262836961') return { loadType: 'empty', data: {} }
    return { loadType: 'artist', data: { info: { name: "Adele's Top Tracks" }, pluginInfo: {}, tracks: [track] } }
  } } }
  let enqueues = 0
  const client = { nodePool: { candidates: () => [nodeView(native)] }, music: { enqueue: () => enqueues++ } }
  await openCatalogPicker({ client, query: 'Adele', actor: { id: 'owner' }, guild: { id: 'guild' }, results: {
    tracks: [track], albums: [], artists: [{ type: 'artist', title: 'Adele', uri: 'https://music.apple.com/us/artist/adele/262836961', sourceName: 'applemusic' }] },
    edit: async payload => { renders.push(payload); return { createMessageComponentCollector: () => collector } } })
  const interact = collector.listeners('collect')[0], replies = []
  const event = customId => ({ customId, user: { id: 'owner' }, values: ['0'], deferUpdate: async () => {}, followUp: async payload => replies.push(payload) })
  await interact(event('srch_tab:artists'))
  assert.match(renders.at(-1).embeds[0].toJSON().title, /Artistas/)
  await interact(event('srch_pick'))
  assert.deepEqual(replies, [])
  assert.match(renders.at(-1).embeds[0].toJSON().title, /populares/)
  assert.match(renders.at(-1).embeds[0].toJSON().description, /Someone Like You/)
  assert.deepEqual(queries, ['https://music.apple.com/us/artist/_/262836961'])
  assert.equal(enqueues, 0)
})

test('LavaSrc Apple Music artist profiles accept the same ID with a canonical URL', async () => {
  const { getArtist } = require('../handlers/music/artists')
  const uri = 'https://music.apple.com/us/artist/adele/262836961'
  const client = { nodePool: { candidates: () => [{ name: 'lavasrc', rest: { resolve: async () => ({ loadType: 'playlist', data: {
    info: { name: "Adele's Top Tracks" }, pluginInfo: { type: 'artist', author: 'Adele', url: 'https://music.apple.com/us/artist/262836961' },
    tracks: [{ encoded: 'top', info: { title: 'Hello', author: 'Adele', sourceName: 'applemusic' } }] } }) } }] } }
  const profile = await getArtist(client, uri)
  assert.equal(profile.artist.uri, 'https://music.apple.com/us/artist/262836961')
  assert.equal(profile.tracks[0].info.title, 'Hello')
})

test('artist album buttons retain real Apple Music album metadata and reject unrelated URLs', () => {
  const { albumsFromTracks } = require('../handlers/music/artists')
  const track = albumUrl => ({ info: { title: 'Hello', author: 'Adele', sourceName: 'applemusic' }, pluginInfo: { albumName: '25', albumUrl } })
  const uri = 'https://music.apple.com/us/album/25/1051394208'
  const albums = albumsFromTracks([track(uri), track(uri.replace('/25/', '/hello/')), track('https://evil.invalid/us/album/25/1051394208'), track('https://music.apple.com/us/song/1051394215')])
  assert.equal(albums.length, 1)
  assert.equal(albums[0].uri, 'https://music.apple.com/us/album/1051394208')
  assert.equal(albums[0].title, '25')
  assert.equal(albums[0].sourceName, 'applemusic')
})

test('Discord category buttons query their resource and source changes reload that category', async () => {
  const { EventEmitter } = require('node:events'), { openCatalogPicker } = require('../handlers/music/catalog-picker')
  const collector = new EventEmitter(), renders = [], calls = []
  const client = { music: { search: async (_query, _who, context) => {
    calls.push({ kind: context.kind, source: context.source })
    const apple = context.source === 'applemusic'
    return { tracks: [], albums: [], artists: [{ type: 'artist', title: 'Adela', uri: apple ? 'https://music.apple.com/us/artist/1765924916' : 'https://open.spotify.com/artist/1111111111111111111111', sourceName: apple ? 'applemusic' : 'spotify' }], statuses: { artists: 'ready' }, sources: { artists: apple ? 'applemusic' : 'spotify' }, source: context.source, kind: context.kind }
  } } }
  await openCatalogPicker({ client, query: 'Adela', results: { kind: 'tracks', source: 'auto', tracks: [{ info: { title: 'Song', author: 'Adela' } }], artists: [], albums: [], statuses: { tracks: 'ready' } }, actor: { id: 'owner' }, guild: { id: 'guild' }, edit: async p => { renders.push(p); return { createMessageComponentCollector: () => collector } } })
  const interact = collector.listeners('collect')[0]
  const event = (customId, values) => ({ customId, values, user: { id: 'owner' }, deferUpdate: async () => {}, reply: async () => {} })
  await interact(event('srch_tab:artists'))
  assert.deepEqual(calls, [{ kind: 'artists', source: 'auto' }])
  assert.match(renders.at(-1).embeds[0].toJSON().description, /Spotify/)
  await interact(event('srch_source', ['applemusic']))
  assert.deepEqual(calls[1], { kind: 'artists', source: 'applemusic' })
  assert.match(renders.at(-1).embeds[0].toJSON().description, /Apple Music/)
  const menu = renders.at(-1).components.flatMap(row => row.toJSON().components).find(c => c.custom_id === 'srch_source')
  assert.equal(menu.options.find(o => o.default).value, 'applemusic')
})

test('a Discord search closed during a category lookup ignores its late results', async () => {
  const { EventEmitter } = require('node:events'), { openCatalogPicker } = require('../handlers/music/catalog-picker')
  const collector = new EventEmitter(), renders = []; let release, entered
  const ready = new Promise(r => { entered = r }), waiting = new Promise(r => { release = r })
  const client = { music: { search: async () => { entered(); await waiting; return { tracks: [], albums: [], artists: [{ type: 'artist', title: 'Late artist', uri: 'https://open.spotify.com/artist/1111111111111111111111' }], statuses: { artists: 'ready' } } } } }
  await openCatalogPicker({ client, query: 'Late', results: { kind: 'tracks', tracks: [{ info: { title: 'Song', author: 'Artist' } }], albums: [], artists: [], statuses: { tracks: 'ready' } }, actor: { id: 'owner' }, guild: { id: 'guild' }, edit: async p => { renders.push(p); return { createMessageComponentCollector: () => collector } } })
  const pending = collector.listeners('collect')[0]({ customId: 'srch_tab:artists', user: { id: 'owner' }, deferUpdate: async () => {} })
  let timer
  try { await Promise.race([ready, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Category lookup was not started')), 1000) })]) }
  finally { clearTimeout(timer) }
  collector.emit('end', [], 'time'); release(); await pending
  assert.deepEqual(renders.at(-1).components, [])
  assert.equal(renders.some(p => p.embeds?.[0]?.toJSON().description?.includes('Late artist')), false)
})

test('web category selection sends the selected platform and preserves other loaded categories', async () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../dashboard/views/pages/player.ejs'), 'utf8')
  const code = source.match(/async function selectSearchKind\(kind\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(code, 'web category navigation must load a category')
  const calls = [], rendered = []
  const context = { lastCatalog: { tracks: [{ title: 'Existing song' }], albums: [], artists: [], statuses: { tracks: 'ready' }, sources: {} }, activeSource: 'applemusic', activeResultKind: 'all', lastSearchQuery: 'Adela', artistGeneration: 0,
    document: { getElementById: () => ({ innerHTML: '' }) }, renderCatalog: (_container, catalog) => rendered.push(catalog),
    searchAPI: async (query, source, kind) => { calls.push({ query, source, kind }); return { artists: [{ title: 'Adela' }], statuses: { artists: 'ready' }, sources: { artists: source } } } }
  const select = require('node:vm').runInNewContext(code + '\nselectSearchKind', context)
  await select('artists'); await select('tracks'); await select('artists')
  assert.deepEqual(calls, [{ query: 'Adela', source: 'applemusic', kind: 'artists' }])
  assert.equal(rendered.at(-1).tracks[0].title, 'Existing song')
  assert.equal(rendered.at(-1).artists[0].title, 'Adela')
})
