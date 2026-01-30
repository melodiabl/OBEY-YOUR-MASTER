const { Shoukaku, Connectors } = require('shoukaku')
const { MusicService } = require('./MusicService')
const { autoStartLavalink } = require('./lavalinkAutoStart')

let musicInstance = null

async function initMusic (client) {
  console.log('[Music] Inicializando sistema Multi-Nodo Público...'.blue)
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  if (!client.readyAt) {
    console.log('[Music] Esperando a que el cliente esté listo...'.yellow)
    await new Promise(resolve => client.once('ready', resolve))
  }

  // LISTA DE NODOS TESTEADOS (HARDCODED)
  // Shoukaku intentará conectarse a todos y usará los que estén disponibles.
  const Nodes = [
    {
      name: 'RY4N (Public)',
      url: '54.80.15.46:25574',
      auth: 'discord.gg/W2GheK3F9m',
      secure: false
    },
    {
      name: 'DivaHost (Public)',
      url: 'lavalink.divahost.net:60002',
      auth: 'youshallnotpass',
      secure: false
    },
    {
      name: 'Public2 (Public)',
      url: 'utopia.pylex.xyz:10167',
      auth: 'noise',
      secure: false
    },
    {
      name: 'ARINO HQ US (Public)',
      url: 'us.sanode.xyz:25568',
      auth: 'discord.gg/W2GheK3F9m',
      secure: false
    },
    {
      name: 'Kronix (Public)',
      url: 'lavalink.kronix.xyz:2333',
      auth: 'youshallnotpass',
      secure: false
    }
  ]

  const shoukakuOptions = {
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 20,
    reconnectInterval: 10,
    moveOnDisconnect: true
  }

  console.log(`[Music] Intentando conectar a ${Nodes.length} nodos públicos...`.blue)
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, shoukakuOptions)

  if (client.readyAt) {
    process.nextTick(() => client.emit('clientReady'))
  }

  shoukaku.on('ready', (name) => console.log(`[Lavalink] Nodo "${name}" conectado y listo.`.green))
  
  shoukaku.on('error', (name, error) => {
    // Solo mostramos errores que no sean de conexión inicial denegada para no saturar la consola
    if (!error?.message?.includes('ECONNREFUSED')) {
      console.error(`[Lavalink] Error en nodo "${name}": ${error.message || error}`.red)
    }
  })

  shoukaku.on('disconnect', (name, players, moved) => {
    console.warn(`[Lavalink] Nodo "${name}" desconectado.`.yellow)
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
