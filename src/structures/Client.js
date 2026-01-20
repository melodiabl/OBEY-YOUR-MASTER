const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PresenceUpdateStatus
} = require('discord.js')
const GuildDB = require('../database/schemas/Guild.db')
const { abbreviateNumber } = require('../helpers/helpers')
const Database = require('../database/mongoose')
const BotUtils = require('./Utils')
const { initMusic } = require('../music')
module.exports = class extends Client {
  constructor (
    options = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
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
    super({
      ...options
    })

    this._eventListeners = new Map()

    this.dbGuild = new GuildDB()
    this.db = new Database()

    this.commands = new Collection()
    this.slashCommands = new Collection()
    this.slashArray = []

    this.utils = new BotUtils(this)

    this.start()
  }

  async start () {
    await this.loadEvents()
    await this.loadHandlers()
    await this.loadCommands()
    await this.loadSlashCommands()
    this.initMusicSystem()
    await this.db.connect()

    this.login(process.env.BOT_TOKEN)
  }

  async initMusicSystem () {
    try {
      await initMusic(this)
    } catch (e) {
      console.error('[Music] Error inicializando el sistema de música:'.red, e)
    }
  }

  async loadCommands () {
    console.log(`(${process.env.PREFIX.split(' ').join(', ')}) Cargando comandos`.yellow)
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
      `(${process.env.PREFIX.split(' ').join(', ')}) ${this.commands.size} Comandos cargados`.green
    )
  }

  async loadSlashCommands () {
    console.log('(/) Cargando comandos'.yellow)
    await this.slashCommands.clear()

    this.slashArray = []

    let RUTA_ARCHIVOS = await this.utils.loadFiles('/src/slashCommands')

    // Orden estable: evita cambios de orden al registrar.
    RUTA_ARCHIVOS = RUTA_ARCHIVOS.slice().sort((a, b) => String(a).localeCompare(String(b), 'en', { sensitivity: 'base' }))

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const COMANDO = require(rutaArchivo)
          const partes = rutaArchivo.split(/[\\/]/)
          const CATEGORIA = partes[partes.length - 2]
          const NOMBRE_COMANDO = partes.pop().split('.')[0]
          COMANDO.CMD.name = NOMBRE_COMANDO
          COMANDO.CATEGORY = CATEGORIA

          if (NOMBRE_COMANDO) this.slashCommands.set(NOMBRE_COMANDO, COMANDO)

          // Permite comandos "legacy"/migrados: se pueden ejecutar si existen en Discord,
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

    // No usar removeAllListeners(): rompe listeners de librerías externas
    // (y puede afectar eventos raw/voice necesarios para voz/musica).
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
