const { MusicService } = require('./MusicService')

let musicInstance = null

function initMusic (client) {
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  const service = new MusicService()
  musicInstance = service
  if (client) client.music = service
  return service
}

function getMusic (client) {
  return client?.music || musicInstance || null
}

module.exports = {
  initMusic,
  getMusic,
  MusicService
}
