const { Shoukaku, Connectors } = require('shoukaku')
const { MusicService } = require('./MusicService')
const { autoStartLavalink } = require('./lavalinkAutoStart')

let musicInstance = null

async function initMusic (client) {
  console.log('[Music] Inicializando sistema con Nodo Público (Hardcoded)...'.blue)
  if (client?.music) return client.music
  if (musicInstance) {
    client.music = musicInstance
    return musicInstance
  }

  if (!client.readyAt) {
    console.log('[Music] Esperando a que el cliente esté listo...'.yellow)
    await new Promise(resolve => client.once('ready', resolve))
  }

  // CONFIGURACIÓN HARDCODED (Nodo Público RY4N)
  // Se ignoran los valores del .env para asegurar conexión inmediata
  const host = '54.80.15.46'
  const port = '25574'
  const password = 'discord.gg/W2GheK3F9m'
  const secure = false

  const Nodes = [{
    name: 'RY4N Public Node',
    url: `${host}:${port}`,
    auth: password,
    secure: secure
  }]

  const shoukakuOptions = {
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 20,
    reconnectInterval: 10,
    moveOnDisconnect: true
  }

  console.log(`[Music] Conectando directamente a Nodo Público: ${Nodes[0].url}...`.blue)
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes, shoukakuOptions)

  if (client.readyAt) {
    process.nextTick(() => client.emit('clientReady'))
  }

  shoukaku.on('ready', (name) => console.log(`[Lavalink] Nodo "${name}" conectado correctamente.`.green))
  shoukaku.on('error', (name, error) => {
    if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('closed')) {
      console.log(`[Lavalink] Nodo "${name}" intentando reconectar...`.yellow)
    } else {
      console.error(`[Lavalink] Error en nodo "${name}": ${error}`.red)
    }
  })
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
