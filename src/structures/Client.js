const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PresenceUpdateStatus
} = require('discord.js')
const GuildDB = require('../database/schemas/Guild.db')
const Database = require('../database/mongoose')
const BotUtils = require('./Utils')
const { initMusic, autoStartLavalink } = require('../music')
const { loadPlugins: loadPluginsFromDisk } = require('../core/plugins/pluginLoader')

module.exports = class extends Client {
  constructor (
    options = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
      ],
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction
      ],
      allowedMentions: {
        parse: ['roles', 'users'],
        repliedUser: false
      },
      presence: {
        activities: [
          {
            name: process.env.STATUS || 'OBEY YOUR MASTER',
            type: ActivityType[process.env.STATUS_TYPE] ?? ActivityType.Listening
          }
        ],
        status: PresenceUpdateStatus.Online
      }
    }
  ) {
    super({ ...options })

    this._eventListeners = new Map()

    this.dbGuild = new GuildDB()
    this.db = new Database()

    this.commands = new Collection()
    this.slashCommands = new Collection()
    this.slashArray = []

    this.plugins = new Collection()
    this.pluginMeta = { lastLoad: null, lastResult: null }

    this.utils = new BotUtils(this)

    this.start()
  }

  async start () {
    await this.loadPlugins()
    await this.loadEvents()
    await this.loadHandlers()
    await this.loadCommands()
    await this.loadSlashCommands()
    
    // Conectar DB antes del login
    await this.db.connect()

    // Login del bot para que esté online lo antes posible
    this.login(process.env.BOT_TOKEN)

    // Lanzamos Lavalink y el sistema de música en segundo plano (asíncrono)
    // Esto evita que el host mate el proceso si Lavalink tarda mucho en arrancar
    this.launchMusicSystem().catch(e => console.error('[Music] Error en lanzamiento asíncrono:', e))
  }

  async launchMusicSystem () {
    // Iniciamos Lavalink (esto ahora no bloquea el login del bot)
    await this.autoStartLavalink()
    
    // Inicializamos el sistema de música (Shoukaku gestionará los reintentos)
    await this.initMusicSystem()
  }

  async loadPlugins () {
    try {
      const res = await loadPluginsFromDisk(this)
      this.pluginMeta.lastLoad = new Date()
      this.pluginMeta.lastResult = res
      this.plugins.clear()
      for (const p of res.plugins) this.plugins.set(p.name, p)
      if (res.loaded || res.failed) {
        console.log(`(plugins) Cargados=${res.loaded} Fallidos=${res.failed} Dir=${res.dir}`.cyan)
      }
    } catch (e) {
      console.log(`(plugins) Error cargando plugins: ${e?.message || e}`.bgRed)
    }
  }

  async initMusicSystem () {
    try {
      await initMusic(this)
    } catch (e) {
      console.error('[Music] Error inicializando el sistema de música:'.red, e)
    }
  }

  async autoStartLavalink () {
    try {
      const res = await autoStartLavalink(this)
      if (res?.started) {
        console.log(`[Lavalink] Autostart: ${res.ok ? 'ok' : 'fail'} host=${res.host || 'n/a'} port=${res.port || 'n/a'}`.cyan)
      }
      if (res?.ok === false) {
        const details = []
        if (res.javaBin) details.push(`java=${res.javaBin}`)
        if (res.code) details.push(`code=${res.code}`)
        if (res.jarPath) details.push(`jar=${res.jarPath}`)
        if (res.error) details.push(`error=${res.error}`)
        const extra = details.length ? ` (${details.join(' ')})` : ''
        console.log(`[Lavalink] Autostart falló: ${res.reason || 'unknown'}${extra}`.yellow)
      }
    } catch (e) {
      console.log(`[Lavalink] Autostart error: ${e?.message || e}`.yellow)
    }
  }

  async loadCommands () {
    const rawPrefix = String(process.env.PREFIX || '!').trim()
    const envPrefixes = rawPrefix ? rawPrefix.split(/\s+/g) : ['!']
    console.log(`(${envPrefixes.join(', ')}) Cargando comandos`.yellow)
    await this.commands.clear()

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/src/comandos')

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const COMANDO = require(rutaArchivo)
          const partes = rutaArchivo.split(/[\\/]/)
          const CATEGORIA = partes[partes.length - 2]
          const NOMBRE_COMANDO = partes.pop().split('.')[0]
          COMANDO.NAME = NOMBRE_COMANDO
          COMANDO.CATEGORY = CATEGORIA

          if (NOMBRE_COMANDO) this.commands.set(NOMBRE_COMANDO, COMANDO)
        } catch (e) {
          console.log(`ERROR AL CARGAR EL COMANDO ${rutaArchivo}`.bgRed)
          console.log(e)
        }
      })
    }

    console.log(
      `(${envPrefixes.join(', ')}) ${this.commands.size} Comandos cargados`.green
    )
  }

  async loadSlashCommands () {
    console.log('(/) Cargando comandos'.yellow)
    await this.slashCommands.clear()

    this.slashArray = []

    let RUTA_ARCHIVOS = await this.utils.loadFiles('/src/slashCommands')

    // Orden estable: evita cambios de orden al registrar.
    // Priorizamos la carpeta 'music' para asegurar que no se queden fuera por el límite de 100 comandos globales.
    RUTA_ARCHIVOS = RUTA_ARCHIVOS.slice().sort((a, b) => {
      const aIsMusic = a.includes('/music/') || a.includes('\\music\\')
      const bIsMusic = b.includes('/music/') || b.includes('\\music\\')
      if (aIsMusic && !bIsMusic) return -1
      if (!aIsMusic && bIsMusic) return 1
      return String(a).localeCompare(String(b), 'en', { sensitivity: 'base' })
    })

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const COMANDO = require(rutaArchivo)
          const partes = rutaArchivo.split(/[\\/]/)
          const CATEGORIA = partes[partes.length - 2]
          const NOMBRE_COMANDO = partes.pop().split('.')[0]

          // Archivos auxiliares (ej: _catalog.js) o mÃ³dulos sin CMD: se ignoran.
          if (String(NOMBRE_COMANDO).startsWith('_')) return
          if (!COMANDO?.CMD || typeof COMANDO.CMD.toJSON !== 'function') return

          COMANDO.CMD.name = NOMBRE_COMANDO
          COMANDO.CATEGORY = CATEGORIA

          if (NOMBRE_COMANDO) this.slashCommands.set(NOMBRE_COMANDO, COMANDO)

          // Permite comandos legacy/migrados: se pueden ejecutar si existen en Discord,
          // pero no se registran (no cuentan para el límite de 100 global).
          if (COMANDO.REGISTER !== false) this.slashArray.push(COMANDO.CMD.toJSON())
        } catch (e) {
          console.log(`(/) ERROR AL CARGAR EL COMANDO ${rutaArchivo}`.bgRed)
          console.log(e)
        }
      })
    }

    console.log(`(/) ${this.slashCommands.size} Comandos cargados`.green)
  }

  async loadHandlers () {
    console.log('(-) Cargando handlers'.yellow)

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/src/handlers')

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          require(rutaArchivo)(this)
        } catch (e) {
          console.log(`ERROR AL CARGAR EL HANDLER ${rutaArchivo}`.bgRed)
          console.log(e)
        }
      })
    }

    console.log(`(-) ${RUTA_ARCHIVOS.length} Handlers Cargados`.green)
  }

  async loadEvents () {
    console.log('(+) Cargando eventos'.yellow)

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/src/eventos')

    // No usar removeAllListeners(): rompe listeners de librerías externas.
    for (const [eventName, listener] of this._eventListeners.entries()) {
      this.removeListener(eventName, listener)
    }
    this._eventListeners.clear()

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const EVENTO = require(rutaArchivo)
          const NOMBRE_EVENTO = rutaArchivo
            .split('\\')
            .pop()
            .split('/')
            .pop()
            .split('.')[0]
          const listener = EVENTO.bind(null, this)
          this.on(NOMBRE_EVENTO, listener)
          this._eventListeners.set(NOMBRE_EVENTO, listener)
        } catch (e) {
          console.log(`ERROR AL CARGAR EL EVENTO ${rutaArchivo}`.bgRed)
          console.log(e)
        }
      })
    }

    console.log(`(+) ${RUTA_ARCHIVOS.length} Eventos Cargados`.green)
  }
}
