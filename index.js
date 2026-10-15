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

require('./handlers/music/nodes-runtime').initializeNodes(client, config)

// ─── Handlers ─────────────────────────────────────────────────────────────────

const coreHandlers = [
  'clientvariables','command','loaddb','assets','configuration','events','slashCommands','cards-runtime','utilities','musichandler','jobs','architect',
  'logger','anti_nuke','antidiscord','antilinks','anticaps','antispam',
  'blacklist','keyword','antimention','autobackup','apply','ticket',
  'ticketevent','roster','joinvc','boostlog','welcome','leave',
  'ghost_ping_detector','antiselfbot','jointocreate','reactionrole',
  'ranking','timedmessages','membercount','autoembed','suggest',
  'validcode','dailyfact','aichat','mute','automeme','counter',
  'extraevents','giveaway','invitetracking','birthdayScheduler',
]

for (const name of coreHandlers) {
  try {
    const initialize = require('./handlers/' + name)
    const core = ['clientvariables', 'command', 'loaddb', 'assets', 'configuration', 'events', 'slashCommands', 'cards-runtime', 'utilities', 'musichandler', 'jobs', 'architect', 'logger'].includes(name)
    const initialized = core ? initialize(client) : require('./handlers/feature-registration').registerFeature(client, name, initialize)
    Promise.resolve(initialized).catch(error => console.error('[Handler] ' + name + ': ' + error.message))
  }
  catch (e) { console.warn('[Handler] ' + name + ': ' + e.message) }
}

for (const name of ['livelog','youtube']) {
  try { require('./social_log/' + name)(client) } catch {}
}

// ─── Login ────────────────────────────────────────────────────────────────────

const token = process.env.token || process.env.BOT_TOKEN || config.token
if (!token) { console.error('[Bot] BOT_TOKEN no configurado'.red); process.exit(1) }

client.once('dbReady', () => {
  require('./dashboard/index')(client).catch(error => console.warn('[Dashboard] Error:', error.message))

})
client.login(token).catch(error => { console.error('[Bot] Login failed:', error.message); process.exitCode = 1 })
let shuttingDown = false
async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  client._shuttingDown = true
  client.stopNodes?.()
  client.stopAssets?.()
  client.stopDatabaseInitialization?.()
  const timeout = setTimeout(() => process.exit(1), 20000)
  timeout.unref()
  try {
    await client.stopCards?.()
    await client.stopJobs?.()
    await client.music?.flushSessions?.()
    await client.flushDatabase?.()
    await Promise.allSettled([...client.shoukaku.players.keys()].map(id => client.shoukaku.leaveVoiceChannel(id)))
    client.destroy()
    await mongoose.disconnect()
    clearTimeout(timeout)
    process.exit(0)
  } catch (error) { console.error('[Bot] Shutdown failed:', error.message); process.exit(1) }
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)

module.exports = client
