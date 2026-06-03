require('dotenv').config()
require('colors')
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js')

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

const lavalinkNodes = (config.clientsettings?.nodes || []).map(n => ({
  name: n.identifier || n.host || 'Main',
  url: (n.host || '127.0.0.1') + ':' + (n.port || 2333),
  auth: n.password || 'youshallnotpass',
  secure: !!n.secure,
}))

if (lavalinkNodes.length) {
  client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), lavalinkNodes, {
    resume: true, resumeTimeout: 60,
    reconnectTries: 10, reconnectInterval: 5000,
    moveOnDisconnect: true,
  })
  client.shoukaku.on('ready', n => console.log('[Lavalink] Nodo "' + n + '" conectado'.green))
  client.shoukaku.on('error', (n, e) => console.error('[Lavalink] Error en "' + n + '":'.red, e?.message))
  client.shoukaku.on('disconnect', n => console.warn('[Lavalink] "' + n + '" desconectado'.yellow))
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
  'extraevents','giveaway','invitetracking',
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
  require('./dashboard/index')(client).catch(e => console.warn('[Dashboard] Error:', e.message))
})
module.exports = client
