const express = require('express')
const session = require('express-session')
const http = require('node:http')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { PermissionsBitField } = require('discord.js')
const { createCanvas } = require('@napi-rs/canvas')
const { cardAssetsFixture } = require('../test/helpers/card-assets')
const { createCardAssets } = require('../handlers/card-assets')
const { canManageGuild } = require('../handlers/permissions')
const { sessionAuth } = require('../dashboard/auth')
const { csrfProtection } = require('../dashboard/security')
const { cardPool } = require('../handlers/card-pool')
const f = cardAssetsFixture(), service = createCardAssets(f.model)
let allowed = true
const guildId = 'cards-fixture'
const avatar = createCanvas(48, 48); avatar.getContext('2d').fillRect(0, 0, 48, 48)
const guild = { id: guildId, name: 'Comunidad de prueba', memberCount: 42 }
guild.members = { fetch: async () => ({ id: 'fixture-admin', guild, permissions: new PermissionsBitField(allowed ? 8n : 0n),
  user: { username: 'Admin de prueba', displayAvatarURL: () => avatar.toBuffer('image/png') } }) }
const config = { welcome: { channel: 'chat', msg: 'Bienvenido {user} a {guild}', pb: true, frame: true, framecolor: '#3A98F0', membercount: true, servername: true },
  leave: { msg: 'Hasta pronto {user}', pb: true, membercount: true, servername: true, framecolor: '#3A98F0' } }
const client = Object.assign(new EventEmitter(), { settings: { get: (id, key) => key ? key.split('.').reduce((value, part) => value?.[part], config) : config },
  guilds: { cache: new Map([[guildId, guild]]) }, cardAssets: service, _dbReady: true })
require('../handlers/cards-runtime')(client)
const app = express(), server = http.createServer(app)
const port = Number(process.argv[2] || 0)
server.listen(port, '127.0.0.1', () => {
  const origin = `http://127.0.0.1:${server.address().port}`
  app.use(express.json({ limit: '64kb' }))
  app.use(session({ secret: 'cards-fixture-only-not-production', resave: false, saveUninitialized: false }))
  app.use(csrfProtection(origin))
  app.set('views', path.resolve(__dirname, '../dashboard/views')); app.set('view engine', 'ejs')
  app.use(express.static(path.resolve(__dirname, '../dashboard/public')))
  app.get('/fixture-login', (req, res) => { req.session.user = { id: 'fixture-admin', username: 'Prueba', expires_at: Date.now() + 7200000, guilds: [{ id: guildId, permissions: '32' }] }; res.redirect(`/cards/${guildId}`) })
  app.get('/fixture-info', (req, res) => res.json({ fixture: true, production: false, guildId }))
  app.get('/fixture-reset', (req, res) => { f.records.clear(); allowed = true; res.json({ fixture: true }) })
  app.get('/fixture-mode/:mode', (req, res) => { allowed = req.params.mode !== 'denied'; res.json({ fixture: true }) })
  app.get('/api/stats', (req, res) => res.json({ guilds: 1 }))
  require('../dashboard/cards-routes')(app, client, { canManageGuild, requireAuth: sessionAuth(async () => { throw Error('expired') }),
    requireFreshGuildPermissions: (req, res, next) => { if (req.session.user) req.session.user.guilds = [{ id: guildId, permissions: allowed ? '32' : '0' }]; next() } })
  console.log(JSON.stringify({ origin, fixture: true, production: false }))
})
async function stop() { client._shuttingDown = true; await client.stopCards(); server.close(() => process.exit(0)) }
process.once('SIGTERM', stop); process.once('SIGINT', stop)
