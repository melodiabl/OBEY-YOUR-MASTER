const { normalizePublicTrack } = require('./utils')
const { allowedMusicTrack } = require('./nodes-config')
const { NAME } = require('./liked-playlist')
function safeURL(value, image = false) {
  try {
    const url = new URL(value)
    return (image ? url.protocol === 'https:' : ['http:', 'https:'].includes(url.protocol)) && !url.username && !url.password && url.href.length <= 2048 ? url.href : null
  } catch { return null }
}
function libraryTrack(track) {
  const raw = track?.info || track || {}
  const info = { ...track, ...raw, uri: raw.uri || track?.uri || track?.url, title: raw.title || track?.title, author: raw.author || track?.author,
    length: raw.length || track?.length || track?.duration || 0,
    artworkUrl: raw.artworkUrl || track?.artworkUrl || track?.artwork || null }
  const normalized = normalizePublicTrack({ info })
  const uri = safeURL(normalized.uri)
  const key = String(track?.trackId || uri || track?._id || '').slice(0, 8192)
  return { key, title: normalized.title.slice(0, 256), author: normalized.author.slice(0, 256), uri,
    artworkUrl: safeURL(normalized.artworkUrl, true), length: Number.isFinite(normalized.length) && normalized.length >= 0 ? normalized.length : 0,
    isStream: normalized.isStream, sourceName: normalized.sourceName.slice(0, 256),
    playCount: Number.isSafeInteger(track?.playCount) && track.playCount >= 0 ? track.playCount : 0,
    playable: !!uri && allowedMusicTrack({ ...track, info: { ...info, uri } }) }
}
function playlistSummary(playlist) {
  return { id: String(playlist._id), name: String(playlist.name || 'Playlist').slice(0, 256), automatic: false,
    trackCount: Array.isArray(playlist.tracks) ? playlist.tracks.length : 0 }
}
function librarySnapshot(userId, guildId, liked, playlists, recent, topTracks, topUsers) {
  return { userId, guildId, liked: liked.map(libraryTrack),
    playlists: [{ id: 'liked', name: NAME, automatic: true, trackCount: liked.length }, ...playlists.map(playlistSummary)],
    recent: recent.map(libraryTrack), top: { tracks: topTracks.map(libraryTrack),
      users: topUsers.map(user => ({ suffix: String(user.userId || '').slice(-4) || '—', playCount: Number.isSafeInteger(user.playCount) && user.playCount >= 0 ? user.playCount : 0 })) } }
}
module.exports = { libraryTrack, playlistSummary, librarySnapshot }
