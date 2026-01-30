const { Shoukaku, Connectors } = require('shoukaku')
const { MusicService } = require('./MusicService')
const { autoStartLavalink } = require('./lavalinkAutoStart')

let musicInstance = null

async function initMusic (client) {
  console.log('[Music] Inicializando sistema ULTRA-STABLE (SSL/443)...'.blue)
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  if (!client.readyAt) {
    console.log('[Music] Esperando a que el cliente esté listo...'.yellow)
    await new Promise(resolve => client.once('ready', resolve))
  }

  // NODOS SSL (PUERTO 443) - Son mucho más estables y difíciles de bloquear por el host.
  const Nodes = [
    {
      name: 'AjieBlogs (SSL)',
      url: 'lavalink.ajieblogs.eu.org:443',
      auth: 'https://dsc.gg/ajiedev',
      secure: true
    },
    {
      name: 'AjieBlogs V4 (SSL)',
      url: 'lava-v4.ajieblogs.eu.org:443',
      auth: 'https://dsc.gg/ajiedev',
      secure: true
    }
  ]

  const shoukakuOptions = {
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 30, // Aumentado para mayor persistencia
    reconnectInterval: 15, // Intervalo más largo para evitar bloqueos por rate-limit
    moveOnDisconnect: true
  }

  console.log(`[Music] Intentando conectar a ${Nodes.length} nodos SSL seguros...`.blue)
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, shoukakuOptions)

  if (client.readyAt) {
    process.nextTick(() => client.emit('clientReady'))
  }

  shoukaku.on('ready', (name) => {
    console.log(`[Lavalink] Nodo SSL "${name}" conectado con éxito. Música lista.`.green)
  })
  
  shoukaku.on('error', (name, error) => {
    // Reportamos errores de forma más descriptiva para diagnóstico
    const msg = error?.message || String(error)
    if (msg.includes('ECONNREFUSED')) {
      console.log(`[Lavalink] Nodo "${name}" rechazó la conexión (¿Host bloqueado?).`.yellow)
    } else if (msg.includes('401')) {
      console.log(`[Lavalink] Nodo "${name}" error de autenticación (Password incorrecta).`.red)
    } else {
      console.log(`[Lavalink] Debug Nodo "${name}": ${msg}`.gray)
    }
  })

  shoukaku.on('disconnect', (name, players, moved) => {
    console.warn(`[Lavalink] Nodo "${name}" se ha desconectado de la red.`.yellow)
  })

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
