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
  console.log('[DEBUG-Music] Inicializando sistema Shoukaku...'.gray)
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  if (!client.readyAt) {
    console.log('[DEBUG-Music] Esperando evento "ready" de Discord...'.gray)
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

  const shoukakuOptions = {
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 20,
    reconnectInterval: 10,
    moveOnDisconnect: true
  }

  console.log(`[DEBUG-Music] Intentando conectar nodo Shoukaku a ${Nodes[0].url}...`.gray)
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, shoukakuOptions)

  if (client.readyAt) {
    console.log('[DEBUG-Music] Forzando evento clientReady para Shoukaku.'.gray)
    process.nextTick(() => client.emit('clientReady'))
  }

  shoukaku.on('ready', (name) => {
    console.log(`[Lavalink] Nodo "${name}" conectado y listo para reproducir.`.green)
  })

  shoukaku.on('error', (name, error) => {
    if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('closed')) {
      console.log(`[DEBUG-Music] Nodo "${name}" no disponible aún (ECONNREFUSED). Reintentando en segundo plano...`.gray)
    } else {
      console.error(`[Lavalink] Error crítico en nodo "${name}": ${error}`.red)
    }
  })

  shoukaku.on('disconnect', (name, players, moved) => {
    console.warn(`[Lavalink] Nodo "${name}" se ha desconectado.`.yellow)
  })

  shoukaku.on('debug', (name, info) => {
    if (process.env.MUSIC_DEBUG === 'true') {
      console.log(`[DEBUG-Shoukaku] ${name}: ${info}`.gray)
    }
  })

  const service = new MusicService(shoukaku)
  musicInstance = service
  if (client) client.music = service
  
  console.log('[DEBUG-Music] MusicService inyectado en el cliente.'.gray)
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
