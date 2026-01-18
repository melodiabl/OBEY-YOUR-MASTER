const { Shoukaku, Connectors } = require('shoukaku')
const { MusicService } = require('./MusicService')

let musicInstance = null

async function initMusic (client) {
  console.log('[Music] Inicializando sistema...'.blue)
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  // Esperar a que el bot esté listo
  if (!client.readyAt) {
    console.log('[Music] Esperando a que el cliente esté listo...'.yellow)
    await new Promise(resolve => client.once('ready', resolve))
  }

  const Nodes = [{
    name: 'Main Node',
    url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
    auth: process.env.LAVALINK_PASSWORD,
    secure: process.env.LAVALINK_SECURE === 'true'
  }]

  console.log(`[Music] Conectando a Lavalink en ${Nodes[0].url}...`.blue)
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes)

  // Forzar inicialización si el cliente ya está listo, ya que Shoukaku espera 'clientReady'
  if (client.readyAt) {
    process.nextTick(() => client.emit('clientReady'))
  }

  shoukaku.on('ready', (name) => console.log(`[Lavalink] Nodo "${name}" conectado correctamente.`.green))
  shoukaku.on('error', (name, error) => console.error(`[Lavalink] Error en nodo "${name}": ${error}`.red))
  shoukaku.on('disconnect', (name, players, moved) => console.warn(`[Lavalink] Nodo "${name}" desconectado.`.yellow))

  const service = new MusicService(shoukaku)
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
