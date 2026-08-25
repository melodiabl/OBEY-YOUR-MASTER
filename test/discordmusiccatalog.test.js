const assert = require('node:assert/strict')
const test = require('node:test')

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
      _playNext: async () => { played = true },
    },
  }
  const message = {
    guild: { id: 'guild' },
    channel: { id: 'text' },
    author: { username: 'Tester' },
  }

  const result = await enqueueCatalogItem(client, message, { id: 'voice' }, {
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
      _playNext: async () => { throw new Error('should not play when busy') },
    },
  }
  const message = { guild: { id: 'g' }, channel: { id: 't' }, author: { username: 'Tester' } }

  const result = await enqueueCatalogItem(client, message, { id: 'v' }, {
    encoded: 'real',
    info: { title: 'Song', author: 'Artist', uri: 'u' },
  })

  assert.equal(result.added, 1)
  assert.equal(result.isNow, false)
  assert.equal(state.queue[0].encoded, 'real')
  assert.equal(state.queue[0].info.requester, 'Tester')
})
