const { Types } = require('mongoose')
function canonicalTrack(track) {
  const info = track.info || track
  const uri = track.uri || track.url || info.uri
  if (!uri) return null
  return {
    _id: track._id || new Types.ObjectId(), uri, url: uri,
    title: info.title || track.title || 'Sin título', author: info.author || 'Artista desconocido',
    duration: info.length || info.duration || 0, artworkUrl: info.artworkUrl || info.thumbnail || null,
    sourceName: info.sourceName || 'youtube', info: { ...info, uri },
  }
}
async function migratePlaylists(canonical, legacy) {
  let migrated = 0
  const rows = await legacy.find({}).lean()
  for (const row of rows) {
    let existing = await canonical.findOne({ userId: row.userId, name: row.name })
    if (!existing) {
      await canonical.create({ _id: row._id, userId: row.userId, name: row.name, isPublic: false, tracks: (row.tracks || []).map(canonicalTrack).filter(Boolean) })
      migrated++
      continue
    }
    const known = new Set(existing.tracks.map(track => track.uri))
    const additions = (row.tracks || []).map(canonicalTrack).filter(track => {
      if (!track || known.has(track.uri)) return false
      known.add(track.uri)
      return true
    })
    if (additions.length) { existing.tracks.push(...additions); await existing.save(); migrated++ }
  }
  const playlists = await canonical.find({})
  for (const playlist of playlists) {
    let changed = false
    for (const track of playlist.tracks) {
      if (!track._id) { track._id = new Types.ObjectId(); changed = true }
      if (!track.url) { track.url = track.uri; changed = true }
    }
    if (changed) await playlist.save()
  }
  return migrated
}
module.exports = { canonicalTrack, migratePlaylists }
