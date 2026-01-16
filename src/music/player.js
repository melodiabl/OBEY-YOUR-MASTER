const { Player } = require('discord-player')
const { registerExtractors } = require('./extractors')
const { registerPlayerEvents } = require('./events')

let playerInstance

async function initPlayer (client) {
  if (client.player) return client.player
  if (playerInstance) {
    client.player = playerInstance
    return playerInstance
  }

  let ffmpegPath
  try {
    // eslint-disable-next-line n/no-missing-require
    ffmpegPath = require('ffmpeg-static')
  } catch {}

  const player = new Player(client, {
    connectionTimeout: 20_000,
    probeTimeout: 10_000,
    lagMonitor: 30_000,
    ffmpegPath: process.env.FFMPEG_PATH || ffmpegPath || undefined
  })

  // Evita warnings de eventos requeridos ("error")
  player.on('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('[Player:error]', e)
  })

  try {
    await registerExtractors(player)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Music] Error registrando extractors:', e)
  }
  registerPlayerEvents(player)

  playerInstance = player
  client.player = player
  return player
}

function getPlayer (client) {
  return client?.player || playerInstance || null
}

module.exports = {
  initPlayer,
  getPlayer
}
