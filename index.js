require('dotenv').config()
require('colors')
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js')
const { Agent } = require('undici')

// Polyfill: splitMessage fue removido en discord.js v14
;(function patchDiscordJs() {
  const djs = require('discord.js')
  function splitMessage(text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
    if (text.length <= maxLength) return [text]
    const split = text.split(char)
    const msgs = []
    let cur = prepend
    for (const chunk of split) {
      if ((cur + chunk + append).length > maxLength && cur !== prepend) {
        msgs.push(cur + append)
        cur = prepend
      }
      cur += (cur !== prepend ? char : '') + chunk
    }
    if (cur) msgs.push(cur)
    return msgs.filter(Boolean)
  }
  djs.splitMessage = splitMessage
  djs.Util = { ...(djs.Util || {}), splitMessage }
})()
const fs = require('fs')
const { Shoukaku, Connectors } = require('shoukaku')
const mongoose = require('mongoose')

const config = require('./botconfig/config.json')
const emojis = require('./botconfig/emojis.json')

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
  allowedMentions: { parse: ['roles', 'users'], repliedUser: false },
  failIfNotExists: false,
  rest: {
    timeout: 60_000,
    retries: 5,
    agent: new Agent({ pipelining: 0 }),
  },
})
// 27+ handlers registran eventos — aumentar límite para evitar el warning
client.setMaxListeners(50)

// ─── Collections ──────────────────────────────────────────────────────────────

client.commands      = new Collection()
client.slashCommands = new Collection()
client.aliases       = new Collection()
client.config        = config
client.emojis_       = emojis

// ─── Languages ────────────────────────────────────────────────────────────────

client.la = {}
for (const lang of fs.readdirSync('./languages').filter(f => f.endsWith('.json'))) {
  client.la[lang.replace('.json', '')] = require('./languages/' + lang)
}
Object.freeze(client.la)

// ─── MongoDB ──────────────────────────────────────────────────────────────────

const MONGO_URL = process.env.MONGO_URL || process.env.mongourl || config.mongourl
if (!MONGO_URL) { console.error('[DB] MONGO_URL no configurado'.red); process.exit(1) }

mongoose.connect(MONGO_URL).then(() => {
  console.log('[DB] MongoDB conectado'.green)
}).catch(e => {
  console.error('[DB] Error conectando MongoDB:'.red, e.message)
  process.exit(1)
})

// ─── Shoukaku (reemplaza erela.js) ────────────────────────────────────────────

const configuredNodes = config.clientsettings?.nodes || []
const envLavalinkHost = process.env.LAVALINK_HOST
const lavalinkNodes = (envLavalinkHost ? [{
  identifier: process.env.LAVALINK_IDENTIFIER || 'Main Lavalink',
  host: envLavalinkHost,
  port: Number(process.env.LAVALINK_PORT || 2333),
  password: process.env.LAVALINK_PASSWORD,
  secure: String(process.env.LAVALINK_SECURE || 'false').toLowerCase() === 'true',
}] : configuredNodes).map(n => ({
  name: n.identifier || n.host || 'Main',
  url: (n.host || '127.0.0.1') + ':' + (n.port || 2333),
  auth: n.password || process.env.LAVALINK_PASSWORD || 'youshallnotpass',
  secure: typeof n.secure === 'string' ? n.secure.toLowerCase() === 'true' : Boolean(n.secure),
}))

if (lavalinkNodes.length) {
  client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), lavalinkNodes, {
    resume: true, resumeTimeout: 60,
    reconnectTries: 1, reconnectInterval: 1,
    moveOnDisconnect: true,
  })

  // Track pending re-add timers per node name
  const _reconnectTimers = new Map()

  function scheduleNodeReconnect(name) {
    if (_reconnectTimers.has(name)) return
    const timer = setTimeout(() => {
      _reconnectTimers.delete(name)
      const node = client.shoukaku.nodes.get(name)
      if (node?.state === 1) return
      if (node) client.shoukaku.nodes.delete(name)
      const cfg = lavalinkNodes.find(n => n.name === name)
      if (!cfg) return
      try {
        client.shoukaku.addNode(cfg)
      } catch (error) {
        console.warn(('[Lavalink] Fallo al re-agregar nodo "' + name + '": ' + (error?.message || error)).red)
        scheduleNodeReconnect(name)
      }
    }, 5_000)
    _reconnectTimers.set(name, timer)
  }

  client.shoukaku.on('ready', name => {
    console.log(('[Lavalink] Nodo "' + name + '" conectado').green)
    // Cancel any pending re-add timer — already back online
    if (_reconnectTimers.has(name)) {
      clearTimeout(_reconnectTimers.get(name))
      _reconnectTimers.delete(name)
    }
    const node = client.shoukaku.nodes.get(name)
    if (node) {
      console.log(('[Lavalink] Nodo "' + name + '" conectado').green)
    }
  })

  client.shoukaku.on('error', (name, e) => {
    console.error(('[Lavalink] Error en "' + name + '": ' + (e?.message || e)).red)
    scheduleNodeReconnect(name)
  })

  client.shoukaku.on('disconnect', name => {
    console.warn(('[Lavalink] "' + name + '" desconectado — reconectando en 5s...').yellow)
    scheduleNodeReconnect(name)
  })
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

const coreHandlers = [
  'clientvariables','command','loaddb','events','slashCommands','musichandler',
  'logger','anti_nuke','antidiscord','antilinks','anticaps','antispam',
  'blacklist','keyword','antimention','autobackup','apply','ticket',
  'ticketevent','roster','joinvc','boostlog','welcome','leave',
  'ghost_ping_detector','antiselfbot','jointocreate','reactionrole',
  'ranking','timedmessages','membercount','autoembed','suggest',
  'validcode','dailyfact','autonsfw','aichat','mute','automeme','counter',
  'extraevents','giveaway','invitetracking','birthdayScheduler',
]

for (const name of coreHandlers) {
  try { require('./handlers/' + name)(client) }
  catch (e) { console.warn('[Handler] ' + name + ': ' + e.message) }
}

for (const name of ['livelog','youtube']) {
  try { require('./social_log/' + name)(client) } catch {}
}

// ─── Login ────────────────────────────────────────────────────────────────────

const token = process.env.token || process.env.BOT_TOKEN || config.token
if (!token) { console.error('[Bot] BOT_TOKEN no configurado'.red); process.exit(1) }

client.login(token).then(() => {
  client.once('dbReady', () => {
    require('./dashboard/index')(client).catch(e => console.warn('[Dashboard] Error:', e.message))
  })
})
module.exports = client
