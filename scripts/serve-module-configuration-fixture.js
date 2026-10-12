// Explicit local fixture: no bot login, credentials or production database.
const express = require('express')
const session = require('express-session')
const http = require('node:http')
const path = require('node:path')
const { PermissionsBitField } = require('discord.js')
const { moduleSettingsFixture } = require('../test/helpers/module-settings')
const { canManageGuild } = require('../handlers/permissions')
const { sessionAuth } = require('../dashboard/auth')
const { csrfProtection } = require('../dashboard/security')
const f = moduleSettingsFixture()
let allowed = true, channelAllowed = true
const guildId = 'configuration-fixture'
f.records.set(guildId, { guildId, welcome: { channel: 'chat', msg: 'Bienvenido {user} a {guild}', dm: true, image: true } })
const channel = { id: 'chat', name: 'bienvenidas', type: 0, permissionsFor: member => new PermissionsBitField(member.id === 'bot' && !channelAllowed ? 0n : 8n) }
const guild = { id: guildId, name: 'Comunidad de prueba', channels: { fetch: async () => new Map([['chat', channel]]) }, members: {
  fetch: async () => ({ id: 'fixture-admin', permissions: new PermissionsBitField(allowed ? 8n : 0n) }), fetchMe: async () => ({ id: 'bot' }),
} }
const client = { settings: f.store, guilds: { cache: new Map([[guildId, guild]]) } }
require('../handlers/configuration')(client)
const app = express(), server = http.createServer(app)
const port = Number(process.argv[2] || 0)
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid fixture port')
server.listen(port, '127.0.0.1', () => {
  const origin = `http://127.0.0.1:${server.address().port}`
  app.use(express.json({ limit: '64kb' }))
  app.use(session({ secret: 'isolated-configuration-fixture-only', resave: false, saveUninitialized: false }))
  app.use(csrfProtection(origin))
  app.set('views', path.resolve(__dirname, '../dashboard/views'))
  app.set('view engine', 'ejs')
  app.use(express.static(path.resolve(__dirname, '../dashboard/public')))
  app.get('/fixture-login', (req, res) => {
    req.session.user = { id: 'fixture-admin', username: 'Prueba', expires_at: Date.now() + 7200000, guilds: [{ id: guildId, permissions: '32' }] }
    res.redirect(`/configuration/${guildId}/welcome`)
  })
  app.get('/fixture-mode/:mode', (req, res) => {
    if (req.params.mode === 'denied') allowed = false
    if (req.params.mode === 'allowed') allowed = true
    if (req.params.mode === 'offline') f.setOffline(true)
    if (req.params.mode === 'online') f.setOffline(false)
    if (req.params.mode === 'deny-channel') channelAllowed = false
    if (req.params.mode === 'permit-channel') channelAllowed = true
    res.json({ fixture: true })
  })
  app.get('/api/stats', (req, res) => res.json({ guilds: 1 }))
  app.get('/fixture-record', (req, res) => res.json({ fixture: true, record: f.records.get(guildId) }))
  require('../dashboard/module-configuration-routes')(app, client, {
    canManageGuild, requireAuth: sessionAuth(async () => { throw new Error('fixture_expired') }),
    requireFreshGuildPermissions: (req, res, next) => { req.session.user.guilds = [{ id: guildId, permissions: allowed ? '32' : '0' }]; next() },
  })
  console.log(JSON.stringify({ origin, fixture: true, production: false }))
})
function stop() { server.close(() => process.exit(0)) }
process.once('SIGTERM', stop)
process.once('SIGINT', stop)
