const { tracksFromResolve } = require('./utils')
const { allowedMusicTrack } = require('./nodes-config')
const { recordingArtist } = require('./recordings')
const { lookupWithTimeout } = require('./resolve-timeout')

function artistUri(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    if (url.hostname === 'open.spotify.com' && /^\/artist\/[A-Za-z0-9]{22}$/.test(url.pathname)) return url.origin + url.pathname
    if (url.hostname === 'music.apple.com' && /^\/[a-z]{2}\/artist\/(?:[^/]+\/)?\d+$/.test(url.pathname)) return url.origin + url.pathname
  } catch {}
  return null
}
function image(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null } catch { return null } }
function normalizeArtist(item) {
  const info = item?.info || item || {}, plugin = item?.pluginInfo || {}
  const uri = artistUri(plugin.url || info.uri), title = String(plugin.author || info.title || info.name || '').trim()
  if (!uri || !title) return null
  return { type: 'artist', title, author: title, uri, identifier: uri.split('/').at(-1),
    sourceName: uri.includes('open.spotify.com') ? 'spotify' : 'applemusic', artworkUrl: image(plugin.artworkUrl || info.artworkUrl) }
}
function artistsFromTracks(tracks, query = '') {
  const seen = new Set(), result = [], phrase = recordingArtist(query)
  for (const track of tracks) {
    const info = track.info || track, plugin = track.pluginInfo || {}
    const title = String(info.author || '').trim()
    const artist = normalizeArtist({ title, uri: plugin.artistUrl || plugin.artistUri, artworkUrl: plugin.artistArtworkUrl })
    if (!artist || seen.has(artist.uri) || phrase && !recordingArtist(title).includes(phrase)) continue
    seen.add(artist.uri); result.push(artist)
  }
  return result.slice(0, 20)
}
function uniqueArtists(items) {
  const seen = new Set()
  return items.filter(item => item && !seen.has(item.uri) && seen.add(item.uri)).slice(0, 20)
}
function albumsFromTracks(tracks) {
  const albums = new Map()
  for (const track of tracks) {
    const info = track.info || track, plugin = track.pluginInfo || {}, uri = plugin.albumUrl
    if (!/^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]{22}$/.test(uri || '')) continue
    if (!albums.has(uri)) albums.set(uri, { type: 'album', title: plugin.albumName || '', author: info.author, uri,
      artworkUrl: image(plugin.albumArtUrl || info.artworkUrl), sourceName: 'spotify' })
  }
  return [...albums.values()]
}
const caches = new WeakMap()
async function getArtist(client, value, { guildId, signal } = {}) {
  const uri = artistUri(value)
  if (!uri) throw Object.assign(Error('Artista inválido.'), { code: 'invalid_artist' })
  if (signal?.aborted) throw Object.assign(Error('Búsqueda cancelada.'), { code: 'artist_cancelled' })
  let cache = caches.get(client)
  if (!cache) { cache = new Map(); caches.set(client, cache) }
  const cached = cache.get(uri)
  if (cached && cached.expires > Date.now()) return cached.value
  const candidates = client.nodePool?.candidates(guildId) || [client.music?.getNode?.(guildId)].filter(Boolean)
  const score = node => Number(Boolean(client.nodePool?.supportsPlugin?.(node.name, 'lavasrc'))) * 2 + Number(Boolean(client.nodePool?.supportsPlugin?.(node.name, 'lavasearch')))
  const nodes = candidates.slice().sort((a, b) => score(b) - score(a))
  if (!nodes.length) throw Object.assign(Error('No hay nodos disponibles.'), { code: 'artist_unavailable' })
  const resolve = async node => {
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(5500)]) : AbortSignal.timeout(5500)
    const result = await lookupWithTimeout(() => node.rest.resolve(uri, { signal: requestSignal }), 5500, signal)
    const plugin = result?.data?.pluginInfo || {}, name = String(result?.data?.info?.name || '')
    const nativeTop = node.native?.isNodeLink && /(?:'s|’s)?\s+Top Tracks$/i.test(name)
    if (result?.loadType !== 'playlist' || plugin.type !== 'artist' && !nativeTop) throw Error('artist_unavailable')
    const artist = normalizeArtist({ info: { title: plugin.author || name.replace(/(?:'s|’s)?\s+Top Tracks$/i, ''), uri }, pluginInfo: plugin })
    if (!artist || artist.uri !== uri) throw Error('artist_unavailable')
    const tracks = tracksFromResolve(result).filter(allowedMusicTrack).slice(0, 50).map(track => ({ ...track, _resolvedNode: node.name }))
    if (!tracks.length) throw Error('artist_unavailable')
    return [{ artist, tracks, albums: albumsFromTracks(tracks).slice(0, 5), ranking: 'provider-top', totalTracks: tracks.length }, node]
  }
  try {
    const [profile, node] = await Promise.any(nodes.slice(0, 3).map(resolve))
    profile.albums = (await Promise.all(profile.albums.map(async album => {
      if (album.title) return album
      try {
        const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(1500)]) : AbortSignal.timeout(1500)
        const data = await lookupWithTimeout(() => node.rest.resolve(album.uri, { signal: requestSignal }), 1500, signal)
        const plugin = data?.data?.pluginInfo || {}, title = data?.data?.info?.name
        if (data?.loadType !== 'playlist' || !title || plugin.url && plugin.url !== album.uri) return null
        return { ...album, title, author: plugin.author || album.author, artworkUrl: image(plugin.artworkUrl) || album.artworkUrl,
          totalTracks: Number.isInteger(plugin.totalTracks) ? plugin.totalTracks : data.data.tracks?.length }
      } catch { return null }
    }))).filter(Boolean)
    if (signal?.aborted) throw Error('artist_cancelled')
    if (cache.size >= 100) cache.delete(cache.keys().next().value)
    cache.set(uri, { expires: Date.now() + 60000, value: profile })
    return profile
  } catch {
    throw Object.assign(Error('No se pudieron cargar las canciones populares del artista. Vuelve a intentarlo.'), { code: signal?.aborted ? 'artist_cancelled' : 'artist_unavailable' })
  }
}
module.exports = { artistUri, normalizeArtist, artistsFromTracks, uniqueArtists, getArtist }
