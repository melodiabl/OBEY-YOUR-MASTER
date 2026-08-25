const assert = require('node:assert/strict')
const test = require('node:test')

const {
  createMusicCatalog,
  normalizeSpotifyTrack,
  normalizeTrack,
  parseCollectionPlayUri,
} = require('../handlers/musiccatalog')

function makeClient(rest, config = {}) {
  const node = { rest }
  return {
    config,
    shoukaku: {
      nodes: new Map([['main', node]]),
      options: { nodeResolver: nodes => nodes.get('main') },
    },
  }
}

test('preserves extended metadata for web player results', () => {
  const lavalinkTrack = normalizeTrack({
    info: {
      title: 'Song',
      author: 'Artist',
      uri: 'https://youtube.com/watch?v=1',
      sourceName: 'youtube',
      identifier: 'video-1',
      isStream: false,
      isSeekable: true,
    },
    pluginInfo: {
      albumName: 'Album',
      releaseDate: '2026-06-08',
      isrc: 'TEST12345678',
    },
  })
  const spotifyTrack = normalizeSpotifyTrack({
    id: 'spotify-1',
    name: 'Spotify Song',
    duration_ms: 123000,
    artists: [{ name: 'Artist' }],
    album: {
      name: 'Spotify Album',
      release_date: '2025-01-01',
      images: [{ url: 'https://img/spotify.jpg' }],
    },
    external_ids: { isrc: 'SPOT12345678' },
    external_urls: { spotify: 'https://open.spotify.com/track/spotify-1' },
  })

  assert.equal(lavalinkTrack.albumName, 'Album')
  assert.equal(lavalinkTrack.releaseDate, '2026-06-08')
  assert.equal(lavalinkTrack.isrc, 'TEST12345678')
  assert.equal(spotifyTrack.albumName, 'Spotify Album')
  assert.equal(spotifyTrack.releaseDate, '2025-01-01')
  assert.equal(spotifyTrack.isrc, 'SPOT12345678')
})

test('returns real tracks, albums and playlists from LavaSearch', async () => {
  const rest = {
    getLavalinkInfo: async () => ({
      sourceManagers: ['spotify'],
      plugins: [{ name: 'lavasearch-plugin' }],
    }),
    fetch: async ({ endpoint }) => {
      assert.equal(endpoint, '/loadsearch')
      return {
        tracks: [{ info: { title: 'Song', author: 'Artist', uri: 'https://open.spotify.com/track/1', sourceName: 'spotify' } }],
        albums: [{ info: { name: 'Album' }, pluginInfo: { url: 'https://open.spotify.com/album/1', author: 'Artist', totalTracks: 12, artworkUrl: 'https://img/album.jpg' } }],
        playlists: [{ info: { name: 'Playlist' }, pluginInfo: { url: 'https://open.spotify.com/playlist/1', author: 'Editor', totalTracks: 40 } }],
      }
    },
    resolve: async () => ({ loadType: 'empty', data: {} }),
  }
  const http = {
    post: async () => ({ data: { access_token: 'token', expires_in: 3600 } }),
    get: async () => ({ data: {} }),
  }
  const catalog = createMusicCatalog(makeClient(rest, { spotify: { clientID: 'id', clientSecret: 'secret' } }), { http })

  const result = await catalog.search('architects', { source: 'spotify' })

  assert.equal(result.tracks[0].title, 'Song')
  assert.equal(result.albums[0].uri, 'https://open.spotify.com/album/1')
  assert.equal(result.albums[0].totalTracks, 12)
  assert.equal(result.playlists[0].type, 'playlist')
  assert.equal(result.advancedSearch, true)
})

test('falls back to regular Lavalink search when LavaSearch is missing', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['youtube'], plugins: [] }),
    fetch: async () => { const error = new Error('not found'); error.status = 404; throw error },
    resolve: async identifier => ({
      loadType: 'search',
      data: [{ info: { title: identifier, author: 'YouTube', uri: 'https://youtube.com/watch?v=1', length: 123000, sourceName: 'youtube' } }],
    }),
  }
  const catalog = createMusicCatalog(makeClient(rest))

  const result = await catalog.search('fallback song', { source: 'youtube' })

  assert.equal(result.tracks.length, 1)
  assert.equal(result.tracks[0].sourceName, 'youtube')
  assert.equal(result.albums.length, 0)
  assert.equal(result.advancedSearch, false)
})

test('turns a direct playlist URL into a playable collection', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: [], plugins: [] }),
    resolve: async () => ({
      loadType: 'playlist',
      data: {
        info: { name: 'Direct playlist' },
        pluginInfo: { type: 'playlist', artworkUrl: 'https://img/list.jpg', author: 'Owner' },
        tracks: [
          { info: { title: 'One', author: 'Artist', uri: 'https://example.com/one', sourceName: 'http' } },
          { info: { title: 'Two', author: 'Artist', uri: 'https://example.com/two', sourceName: 'http' } },
        ],
      },
    }),
  }
  const catalog = createMusicCatalog(makeClient(rest))
  const url = 'https://open.spotify.com/playlist/abc'

  const result = await catalog.search(url)

  assert.equal(result.playlists[0].uri, url)
  assert.equal(result.playlists[0].totalTracks, 2)
  assert.equal(result.tracks.length, 0)
})

test('ranks exact catalog matches and removes duplicate ISRC results', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['spotify'], plugins: [] }),
    fetch: async () => { const error = new Error('not found'); error.status = 404; throw error },
    resolve: async () => ({ loadType: 'empty', data: {} }),
  }
  const leoItems = [
    { id: 'wrong', title: 'Midnight Train', artists: ['Example Artist'], isrc: 'WRONG1' },
    { id: 'cover', title: 'Midnight City', artists: ['Cover Band'], isrc: 'COVER1' },
    { id: 'exact-a', title: 'Midnight City', artists: ['M83'], isrc: 'EXACT1234567' },
    { id: 'exact-b', title: 'Midnight City', artists: ['M83'], isrc: 'EXACT1234567' },
    { id: 'exact-c', title: 'Midnight City', artists: ['M83'], isrc: 'EXACT1234567' },
  ]
  const http = {
    get: async url => {
      if (url === `${'http://140.245.242.153:8081'}/api/search`) return { data: { items: leoItems } }
      if (url.includes('/api/search/albums') || url.includes('/api/search/playlists')) return { data: [] }
      return { data: {} }
    },
  }
  const catalog = createMusicCatalog(makeClient(rest), { http })

  const result = await catalog.search('midnight city', { source: 'spotify', kind: 'tracks', limit: 20 })

  assert.equal(result.tracks[0].title, 'Midnight City')
  assert.equal(result.tracks[0].author, 'M83')
  assert.equal(result.tracks.filter(track => track.isrc === 'EXACT1234567').length, 1)
})

test('uses the public Apple catalog as an album fallback', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['applemusic'], plugins: [] }),
    fetch: async () => { const error = new Error('not found'); error.status = 404; throw error },
    resolve: async () => ({ loadType: 'empty', data: {} }),
  }
  const http = {
    get: async (_url, options) => ({
      data: {
        results: options.params.entity === 'album'
          ? [{ collectionName: 'Discovery', artistName: 'Daft Punk', collectionViewUrl: 'https://music.apple.com/us/album/discovery/1', artworkUrl100: 'https://img/100x100bb.jpg', trackCount: 14 }]
          : [],
      },
    }),
  }
  const catalog = createMusicCatalog(makeClient(rest), { http })

  const result = await catalog.search('Daft Punk', { source: 'applemusic' })

  assert.equal(result.albums[0].title, 'Discovery')
  assert.equal(result.albums[0].totalTracks, 14)
  assert.match(result.albums[0].artworkUrl, /600x600bb/)
})

test('uses real YouTube playlist results when LavaSearch returns no playlists', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['youtube'], plugins: [{ name: 'lavasearch-plugin' }] }),
    fetch: async () => ({ tracks: [], albums: [], playlists: [] }),
    resolve: async () => ({ loadType: 'empty', data: {} }),
  }
  const initialData = {
    contents: [{
      lockupViewModel: {
        contentId: 'PL123',
        contentType: 'LOCKUP_CONTENT_TYPE_PLAYLIST',
        metadata: {
          lockupMetadataViewModel: {
            title: { content: 'Latin hits' },
            metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: [{ text: { content: 'DJ Test' } }] }] } },
          },
        },
        contentImage: {
          collectionThumbnailViewModel: {
            primaryThumbnail: {
              thumbnailViewModel: {
                image: { sources: [{ url: 'https://img/playlist.jpg', width: 720 }] },
                overlays: [{ text: '42 vídeos' }],
              },
            },
          },
        },
      },
    }],
  }
  const http = {
    get: async url => {
      assert.equal(url, 'https://www.youtube.com/results')
      return { data: `<script>var ytInitialData = ${JSON.stringify(initialData)};</script>` }
    },
  }
  const catalog = createMusicCatalog(makeClient(rest), { http })

  const result = await catalog.search('latin hits', { source: 'youtube' })

  assert.equal(result.playlists[0].title, 'Latin hits')
  assert.equal(result.playlists[0].uri, 'https://www.youtube.com/playlist?list=PL123')
  assert.equal(result.playlists[0].totalTracks, 42)
})

test('marks YouTube Music albums with a playable search fallback', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['youtube'], plugins: [{ name: 'lavasearch-plugin' }] }),
    fetch: async () => ({
      tracks: [],
      albums: [{
        info: { name: 'Album from Music' },
        pluginInfo: {
          author: 'Artist',
          type: 'album',
          url: 'https://music.youtube.com/browse/MPREtest',
        },
        tracks: [],
      }],
      playlists: [],
    }),
    resolve: async () => ({ loadType: 'empty', data: {} }),
  }
  const http = { get: async () => ({ data: '<script>var ytInitialData = {}</script>' }) }
  const catalog = createMusicCatalog(makeClient(rest), { http })

  const result = await catalog.search('album', { source: 'ytmusic' })
  const album = result.albums[0]
  const parsed = parseCollectionPlayUri(album.playUri)

  assert.equal(album.uri, 'https://music.youtube.com/browse/MPREtest')
  assert.equal(parsed.title, 'Album from Music')
  assert.equal(parsed.author, 'Artist')
})

test('resolves complete Spotify collections with track metadata', async () => {
  const rest = {
    getLavalinkInfo: async () => ({ sourceManagers: ['spotify'], plugins: [] }),
  }
  const http = {
    get: async url => {
      assert.equal(url, 'http://140.245.242.153:8081/api/resolve')
      return {
        data: {
          type: 'album',
          name: 'Album',
          author: 'Artist',
          artwork: 'https://img/album.jpg',
          total: 2,
          items: [
            { id: 'one', title: 'One', artists: ['Artist'], duration: 1000, isrc: 'ONE' },
            { id: 'two', title: 'Two', artists: ['Artist'], duration: 2000, isrc: 'TWO' },
          ],
        },
      }
    },
  }
  const catalog = createMusicCatalog(makeClient(rest), { http })

  const result = await catalog.resolveCollection('https://open.spotify.com/album/1')

  assert.equal(result.type, 'album')
  assert.equal(result.totalTracks, 2)
  assert.equal(result.tracks.length, 2)
  assert.equal(result.tracks[0].isrc, 'ONE')
})
