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
const { initPlayer } = require('../music/player')
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
            name:
              `${abbreviateNumber(
                new GuildDB().getGuildAllData().length
              )} servers` ?? process.env.STATUS,
            type: ActivityType[process.env.STATUS_TYPE] ?? ActivityType.Playing
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
    await initPlayer(this)
    await this.db.connect()

    this.login(process.env.BOT_TOKEN)
  }

  async loadCommands () {
    console.log(`(${process.env.PREFIX.split(' ').join(', ')}) Cargando comandos`.yellow)
    await this.commands.clear()

    const RUTA_ARCHIVOS = await this.utils.loadFiles('/src/comandos')

    if (RUTA_ARCHIVOS.length) {
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        try {
          const COMANDO = require(rutaArchivo)
          const NOMBRE_COMANDO = rutaArchivo
            .split('\\')
            .pop()
            .split('/')
            .pop()
            .split('.')[0]
          COMANDO.NAME = NOMBRE_COMANDO

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

    if (disabledNames.size || disabledDirs.size) {
      const before = RUTA_ARCHIVOS.length
      RUTA_ARCHIVOS = RUTA_ARCHIVOS.filter((rutaArchivo) => {
        const name = basenameLower(rutaArchivo)
        if (disabledNames.has(name)) return false

        if (disabledDirs.size) {
          const parts = String(rutaArchivo).replace(/\\/g, '/').split('/').map(s => s.toLowerCase())
          if (parts.some(p => disabledDirs.has(p))) return false
        }

        return true
      })
      const removed = before - RUTA_ARCHIVOS.length
      if (removed > 0) {
        console.log(`(/) ${removed} slash commands deshabilitados por env (DISABLE_SLASH_NAMES/DISABLE_SLASH_DIRS)`.yellow)
      }
    }

    // Orden estable: ayuda a que el límite sea determinista si llegas a 100.
    RUTA_ARCHIVOS = RUTA_ARCHIVOS.slice().sort((a, b) => String(a).localeCompare(String(b), 'en', { sensitivity: 'base' }))

    if (RUTA_ARCHIVOS.length) {
      const skipped = []
      RUTA_ARCHIVOS.forEach((rutaArchivo) => {
        if (this.slashArray.length >= maxSlash) {
          skipped.push(basenameLower(rutaArchivo))
          return
        }
        try {
          const COMANDO = require(rutaArchivo)
          const NOMBRE_COMANDO = rutaArchivo
            .split('\\')
            .pop()
            .split('/')
            .pop()
            .split('.')[0]
          COMANDO.CMD.name = NOMBRE_COMANDO

          if (NOMBRE_COMANDO) this.slashCommands.set(NOMBRE_COMANDO, COMANDO)

          this.slashArray.push(COMANDO.CMD.toJSON())
        } catch (e) {
          console.log(`(/) ERROR AL CARGAR EL COMANDO ${rutaArchivo}`.bgRed)
          console.log(e)
        }
      })

      if (skipped.length) {
        console.log(`(/) Límite Discord: publicados solo ${maxSlash} comandos. Omitidos: ${skipped.length}`.yellow)
        console.log(`(/) Omitidos: ${skipped.slice(0, 40).join(', ')}${skipped.length > 40 ? '...' : ''}`.yellow)
      }
    }

    console.log(`(/) ${this.slashCommands.size} Comandos cargados`.green)

    if (this?.application?.commands) {
      this.application.commands.set(this.slashArray)
      console.log(`(/) ${this.slashCommands.size} Comandos Publicados!`.green)
    }
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
