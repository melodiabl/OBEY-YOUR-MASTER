// Local browser fixture only: no Discord login or production database.
const express = require('express'), session = require('express-session'), http = require('node:http'), path = require('node:path')
const { Collection, PermissionsBitField } = require('discord.js')
const { canManageGuild } = require('../handlers/permissions')
const { sessionAuth } = require('../dashboard/auth')
const client = { commands: new Collection(), aliases: new Map(), slashCommands: new Collection(), allCommands: [], settings: { get: () => ({ prefix: '!', MUSIC: true, NSFW: false }) } }
for (let i = 0; i < 65; i++) client.commands.set('utility-' + i, { name: 'utility-' + i, category: 'Info', description: i === 0 ? 'Descripción <img src=x onerror=alert(1)> de prueba' : 'Consulta de prueba ' + i, usage: 'utility-' + i + ' [valor]', run: async () => {} })
client.aliases.set('first', 'utility-0')
client.commands.set('ban', { name: 'ban', category: 'Moderation', memberpermissions: ['BanMembers'], description: 'Sanción de prueba', run: async () => {} })
client.commands.set('eval', { name: 'eval', category: 'Owner', run: async () => {} })
const guild = { id: 'help-fixture', name: 'Comunidad de prueba' }, channel = { id: 'help-channel', guildId: guild.id, name: 'conversación', isTextBased: () => true, permissionsFor: () => new PermissionsBitField(8n) }
let allowed = true, limited = false
const member = () => ({ id: 'fixture-admin', guild, permissions: new PermissionsBitField(limited ? 32n : 8n), roles: { cache: new Collection() }, voice: {} })
guild.members = { fetch: async () => { if (!allowed) throw Error('fixture revoked'); return member() }, fetchMe: async () => ({ guild, permissions: new PermissionsBitField(8n) }) }
guild.channels = { fetch: async id => id ? channel : new Collection([[channel.id, channel]]) }
client.guilds = { cache: new Collection([[guild.id, guild]]) }
require('../handlers/utilities')(client)
const app = express(), server = http.createServer(app)
app.use(session({ secret: 'isolated-help-browser-only', resave: false, saveUninitialized: false }))
app.set('views', path.resolve(__dirname, '../dashboard/views')); app.set('view engine', 'ejs')
app.use(express.static(path.resolve(__dirname, '../dashboard/public')))
app.get('/fixture-login', (req, res) => { req.session.user = { id: 'fixture-admin', username: 'Prueba', expires_at: Date.now() + 7200000, guilds: [{ id: guild.id, permissions: '32' }] }; res.redirect('/help/' + guild.id) })
app.get('/fixture-mode/:mode', (req, res) => { if (req.params.mode === 'denied') allowed = false; if (req.params.mode === 'limited') limited = true; res.json({ fixture: true }) })
app.get('/fixture-info', (req, res) => res.json({ fixture: true, guildId: guild.id }))
app.get('/api/stats', (req, res) => res.json({ guilds: 1 }))
require('../dashboard/help-routes')(app, client, { canManageGuild, requireAuth: sessionAuth(async () => { throw Error('expired') }),
  requireFreshGuildPermissions: (req, res, next) => { req.session.user.guilds = [{ id: guild.id, permissions: allowed ? '32' : '0' }]; next() } })
server.listen(Number(process.argv[2] || 0), '127.0.0.1', () => console.log(JSON.stringify({ origin: 'http://127.0.0.1:' + server.address().port, fixture: true })))
process.once('SIGINT', () => server.close(() => process.exit(0)))
process.once('SIGTERM', () => server.close(() => process.exit(0)))
