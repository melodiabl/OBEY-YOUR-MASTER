const { Shoukaku, Connectors } = require('shoukaku')
const { MusicService } = require('./MusicService')
const { autoStartLavalink } = require('./lavalinkAutoStart')

let musicInstance = null

function normalizeConnectHost (host) {
  const h = String(host || '').trim()
  if (!h) return '127.0.0.1'
  if (h === '0.0.0.0') return '127.0.0.1'
  return h
}

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

  const host = normalizeConnectHost(process.env.LAVALINK_CONNECT_HOST || process.env.LAVALINK_HOST)
  const port = String(process.env.LAVALINK_PORT || '2333')
  const password = String(process.env.LAVALINK_PASSWORD || 'youshallnotpass')

  const Nodes = [{
    name: 'Main Node',
    url: `${host}:${port}`,
    auth: password,
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
  MusicService,
  autoStartLavalink
}
