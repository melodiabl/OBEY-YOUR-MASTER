const NAME = 'Tus Me gusta'
const AUTOMATIC_MESSAGE = 'Tus Me gusta es una lista automática y privada. Se actualiza con el corazón: marca o desmarca canciones para cambiarla.'
function isLikedPlaylist(name) {
  return typeof name === 'string' && name.trim().replace(/\s+/g, ' ').toLowerCase() === NAME.toLowerCase()
}
async function getLikedPlaylist(userId) {
  const songs = await require('./likes').getLikedSongs(userId)
  return { name: NAME, userId, isPublic: false, automatic: true,
    tracks: songs.map(song => ({ ...song, duration: song.length || 0 })) }
}
module.exports = { NAME, AUTOMATIC_MESSAGE, isLikedPlaylist, getLikedPlaylist }
