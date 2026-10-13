// Visual fixture only: no Discord login, production sessions, network providers or DB.
const express = require('express')
const path = require('node:path')
const app = express()
const root = path.resolve(__dirname, '..')
const user = { id: 'fixture-user', username: 'María Fernández', global_name: 'María', avatar: null }
const guild = { id: 'panel-fixture', name: 'Comunidad Aurora', icon: null, memberCount: 1280,
  onlineCount: 240, idleCount: 35, dndCount: 12, offlineCount: 993, warnCount: 3, ticketCount: 8,
  channelCount: 12, roleCount: 9, textChannels: 6, voiceChannels: 3, categories: 2, otherChannels: 1 }
const guilds = [guild, { ...guild, id: 'musica-fixture', name: 'Música y amigos', memberCount: 42 },
  { ...guild, id: 'gaming-fixture', name: 'La comunidad de juegos con un nombre muy largo para comprobar el diseño', memberCount: 378 },
  { ...guild, id: 'invite-fixture', name: 'Un nuevo comienzo', memberCount: 0 }].map((g, i) => ({ ...g, inBot: i !== 3 }))
app.set('views', path.join(root, 'dashboard/views')); app.set('view engine', 'ejs')
app.use(express.static(path.join(root, 'dashboard/public')))
app.use((req, res, next) => { res.locals.csrfToken = 'visual-fixture-only'; next() })
app.get('/fixture-info', (req, res) => res.json({ fixture: true, production: false }))
app.get('/panel', (req, res) => res.render('pages/home', { user, bot: { guilds: 4, commands: 645 } }))
app.get('/dashboard', (req, res) => res.render('pages/dashboard', { user, guilds: req.query.empty ? [] : guilds, clientId: 'fixture-app' }))
app.get('/dashboard/:guildId', (req, res) => res.render('pages/guild', { user, guild: { ...guild, name: req.query.long ? guilds[2].name : guild.name }, settings: { prefix: '!', language: 'es', welcomeMessage: '¡Bienvenido {user}!', welcomeRevision: 'fixture-revision' }, channels: [{ id: 'welcome', name: 'bienvenidas' }], categories: [], roles: [], saved: false, error: null }))
app.get('/stats/:guildId', (req, res) => res.render('pages/stats', { user, guild, topRoles: [], inviteLeaderboard: [] }))
app.get('/library/:guildId', (req, res) => res.render('pages/library', { user, guild, breadcrumb: [{ label: 'Mis servidores', url: '/dashboard' }, { label: guild.name, url: '/dashboard/' + guild.id }, { label: 'Mi biblioteca' }] }))
app.get('/music/:guildId', (req, res) => res.render('pages/music', { guild, muser: { username: user.username, avatarUrl: '/bot.png' }, prefix: '!' }))
app.get('/api/stats', (req, res) => res.json({ guilds: 4, users: 1700, activePlayers: 0, uptime: 19200, ping: 32, memUsed: 120 }))
app.get('/api/sse', (req, res) => { res.type('text/event-stream'); res.end('data: {"guilds":4,"users":1700,"activePlayers":0,"uptime":19200,"ping":32,"memUsed":120}\n\n') })
app.get('/api/nowplaying', (req, res) => res.json({ tracks: [] }))
app.get('/api/player/:guildId', (req, res) => res.json({ success: true, connected: false, state: null }))
app.get('/api/music/lyrics/:guildId', (req, res) => res.json({ success: false, code: 'nothing_playing' }))
app.get(/^\/api\/(music|playlist|top)\//, (req, res) => res.json({ success: true, data: [] }))
app.use((req, res) => res.status(404).json({ fixture: true, error: 'fixture_route_not_implemented' }))
const server = app.listen(Number(process.argv[2] || 0), '127.0.0.1', () => console.log(JSON.stringify({ origin: `http://127.0.0.1:${server.address().port}`, fixture: true, production: false })))
const io = new (require('socket.io').Server)(server)
io.on('connection', socket => {
  socket.on('player:subscribe', (data, callback) => { if (typeof callback === 'function') callback({ ok: false, code: 'fixture_idle' }) })
})
function stop() { io.close(); server.close(() => process.exit(0)); server.closeAllConnections() }
process.once('SIGTERM', stop); process.once('SIGINT', stop)
