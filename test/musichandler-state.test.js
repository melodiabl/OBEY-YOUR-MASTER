const assert = require('node:assert/strict')
const { EventEmitter, once } = require('node:events')
const test = require('node:test')

test('pause and resume emit a synchronized public player state', async () => {
  const client = new EventEmitter()
  const player = {
    position: 42_000,
    volume: 100,
    paused: false,
    setPaused: async value => {
      player.paused = value
    },
  }

  client.shoukaku = {
    players: new Map([['guild-1', player]]),
    nodes: new Map(),
    options: { nodeResolver: () => null },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const state = client.music.getState('guild-1')
  state.currentTrack = {
    info: {
      title: 'Test song',
      author: 'Test artist',
      uri: 'https://example.com/track',
      length: 180_000,
      sourceName: 'youtube',
    },
  }
  state.startedAt = Date.now() - player.position

  const pauseEvent = once(client, 'playerStateUpdate')
  assert.equal(await client.music.pause('guild-1'), true)
  assert.deepEqual(await pauseEvent, ['guild-1'])

  let publicState = client.music.getPublicState('guild-1')
  assert.equal(publicState.paused, true)
  assert.equal(publicState.current.elapsed, 42_000)

  const resumeEvent = once(client, 'playerStateUpdate')
  assert.equal(await client.music.pause('guild-1'), false)
  assert.deepEqual(await resumeEvent, ['guild-1'])

  publicState = client.music.getPublicState('guild-1')
  assert.equal(publicState.paused, false)
  assert.equal(publicState.current.title, 'Test song')
  assert.equal(publicState.queue[0].pos, 0)
})

test('plain text searches try spsearch first and return its list result', async () => {
  const client = new EventEmitter()
  const identifiers = []
  const node = {
    rest: {
      resolve: async identifier => {
        identifiers.push(identifier)
        return {
          loadType: 'search',
          data: [{
            encoded: 'track',
            info: {
              title: 'Spotify song',
              author: 'Artist',
              uri: 'https://open.spotify.com/track/1',
              sourceName: 'spotify',
            },
          }],
        }
      },
    },
  }
  client.shoukaku = {
    players: new Map(),
    nodes: new Map([['main', node]]),
    options: { nodeResolver: nodes => nodes.get('main') },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const result = await client.music.search('test song', 'Tester')

  assert.deepEqual(identifiers, ['spsearch:test song'])
  assert.equal(result.tracks[0].info.title, 'Spotify song')
  assert.equal(result.tracks[0].info.requester, 'Tester')
})

test('a single spsearch track is kept as fallback while ytmsearch provides the list', async () => {
  const client = new EventEmitter()
  const identifiers = []
  const node = {
    rest: {
      resolve: async identifier => {
        identifiers.push(identifier)
        if (identifier.startsWith('spsearch:')) {
          return {
            loadType: 'track',
            data: {
              encoded: 'sp-track',
              info: {
                title: 'Spotify single',
                author: 'Artist',
                uri: 'https://open.spotify.com/track/1',
                sourceName: 'spotify',
              },
            },
          }
        }
        return {
          loadType: 'search',
          data: [{
            encoded: 'yt-track',
            info: {
              title: 'YTM song',
              author: 'Artist',
              uri: 'https://music.youtube.com/watch?v=1',
              sourceName: 'youtube',
            },
          }],
        }
      },
    },
  }
  client.shoukaku = {
    players: new Map(),
    nodes: new Map([['main', node]]),
    options: { nodeResolver: nodes => nodes.get('main') },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const result = await client.music.search('test song', 'Tester')

  assert.deepEqual(identifiers, ['spsearch:test song', 'ytmsearch:test song'])
  assert.equal(result.loadType, 'search')
  assert.equal(result.tracks[0].info.title, 'YTM song')
})

test('search falls back to the single spsearch track when no list source has results', async () => {
  const client = new EventEmitter()
  const node = {
    rest: {
      resolve: async identifier => {
        if (identifier.startsWith('spsearch:')) {
          return {
            loadType: 'track',
            data: {
              encoded: 'sp-track',
              info: {
                title: 'Spotify single',
                author: 'Artist',
                uri: 'https://open.spotify.com/track/1',
                sourceName: 'spotify',
              },
            },
          }
        }
        return { loadType: 'empty', data: null }
      },
    },
  }
  client.shoukaku = {
    players: new Map(),
    nodes: new Map([['main', node]]),
    options: { nodeResolver: nodes => nodes.get('main') },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const result = await client.music.search('test song', 'Tester')

  assert.equal(result.loadType, 'track')
  assert.equal(result.tracks[0].info.title, 'Spotify single')
})

test('spotify album URIs resolve directly and return album tracks', async () => {
  const client = new EventEmitter()
  const identifiers = []
  const node = {
    rest: {
      resolve: async identifier => {
        identifiers.push(identifier)
        return {
          loadType: 'playlist',
          data: {
            info: { name: 'Test Album' },
            tracks: [
              { encoded: 't1', info: { title: 'Track 1', author: 'Artist', uri: 'u1', sourceName: 'spotify' } },
              { encoded: 't2', info: { title: 'Track 2', author: 'Artist', uri: 'u2', sourceName: 'spotify' } },
            ],
          },
        }
      },
    },
  }
  client.shoukaku = {
    players: new Map(),
    nodes: new Map([['main', node]]),
    options: { nodeResolver: nodes => nodes.get('main') },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const result = await client.music.search('https://open.spotify.com/album/abc123', 'Tester')

  assert.deepEqual(identifiers, ['https://open.spotify.com/album/abc123'])
  assert.equal(result.loadType, 'playlist')
  assert.equal(result.tracks.length, 2)
  assert.equal(result.playlistName, 'Test Album')
})

test('skip advances the queue even when the player is paused', async () => {
  const client = new EventEmitter()
  const played = []
  const player = {
    position: 15_000,
    paused: true,
    setPaused: async value => {
      player.paused = value
    },
    playTrack: async payload => {
      played.push(payload.track.encoded)
    },
  }

  client.shoukaku = {
    players: new Map([['guild-1', player]]),
    nodes: new Map(),
    options: { nodeResolver: () => null },
  }
  client.channels = { cache: new Map() }

  require('../handlers/musichandler')(client)
  const state = client.music.getState('guild-1')
  state.currentTrack = {
    encoded: 'current',
    info: {
      title: 'Current',
      author: 'Artist',
      uri: 'https://example.com/current',
      length: 180_000,
      sourceName: 'youtube',
    },
  }
  state.queue = [{
    encoded: 'next',
    info: {
      title: 'Next',
      author: 'Artist',
      uri: 'https://example.com/next',
      length: 180_000,
      sourceName: 'youtube',
    },
  }]
  state.paused = true
  state.lastPosition = 15_000

  assert.equal(await client.music.skip('guild-1'), true)
  assert.equal(player.paused, false)
  assert.deepEqual(played, ['next'])
  assert.equal(state.currentTrack.info.title, 'Next')
  assert.equal(state.queue.length, 0)
})
