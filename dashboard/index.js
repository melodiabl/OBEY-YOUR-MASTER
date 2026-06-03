const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const path = require('path')
const axios = require('axios')

module.exports = async client => {
  const app = express()
  const config = client.config

  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || config.clientid
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
  const SESSION_SECRET = process.env.SESSION_SECRET || 'tomato-dashboard-secret'
  const BASE_URL = process.env.DASHBOARD_BASE_URL || 'http://localhost:3000'
  const PORT = parseInt(process.env.DASHBOARD_PORT || '3000', 10)
  const MONGO_URL = process.env.MONGO_URL || process.env.mongourl || config.mongourl
  const REDIRECT_URI = `${BASE_URL}/auth/callback`

  if (!DISCORD_CLIENT_SECRET) {
    console.warn('[Dashboard] DISCORD_CLIENT_SECRET no configurado, dashboard desactivado.'.yellow)
    return
  }

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, 'views'))
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    store: MongoStore.create({ mongoUrl: MONGO_URL, collectionName: 'dashboard_sessions' }),
  }))

  // Auth middleware
  const requireAuth = (req, res, next) => {
    if (!req.session?.user) return res.redirect('/login')
    next()
  }

  // ─── Routes ───────────────────────────────────────────────────────────────────

  app.get('/login', (req, res) => {
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'identify guilds',
    })
    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
  })

  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query
    if (!code) return res.redirect('/?error=no_code')
    try {
      const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

      const { access_token } = tokenRes.data
      const [userRes, guildsRes] = await Promise.all([
        axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access_token}` } }),
        axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${access_token}` } }),
      ])

      req.session.user = { ...userRes.data, guilds: guildsRes.data, access_token }
      res.redirect('/dashboard')
    } catch (e) {
      res.redirect('/?error=auth_failed')
    }
  })

  app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
  })

  app.get('/', (req, res) => {
    res.render('pages/home', {
      user: req.session?.user || null,
      bot: { guilds: client.guilds.cache.size, commands: client.commands?.size || 0 },
    })
  })

  app.get('/dashboard', requireAuth, (req, res) => {
    const userGuilds = req.session.user.guilds || []
    const manageable = userGuilds.filter(g => (parseInt(g.permissions) & 0x20) === 0x20)
    const botGuilds = manageable.map(g => ({
      ...g,
      inBot: client.guilds.cache.has(g.id),
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
    }))
    res.render('pages/dashboard', { user: req.session.user, guilds: botGuilds, clientId: DISCORD_CLIENT_ID })
  })

  app.get('/dashboard/:guildId', requireAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.redirect(`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot&guild_id=${req.params.guildId}&permissions=8`)

    const userGuild = req.session.user.guilds?.find(g => g.id === req.params.guildId)
    if (!userGuild || (parseInt(userGuild.permissions) & 0x20) !== 0x20)
      return res.redirect('/dashboard?error=no_permission')

    const Guild = require('../database/schemas/GuildSchema')
    const settings = await Guild.findOne({ guildId: guild.id }) || {}

    res.render('pages/guild', {
      user: req.session.user,
      guild: { id: guild.id, name: guild.name, icon: guild.iconURL(), memberCount: guild.memberCount },
      settings,
      channels: guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })).sort((a,b) => a.name.localeCompare(b.name)),
      roles: guild.roles.cache.filter(r => !r.managed && r.id !== guild.id).map(r => ({ id: r.id, name: r.name, color: r.hexColor })).sort((a,b) => b.position - a.position),
    })
  })

  app.post('/dashboard/:guildId', requireAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'Guild not found' })

    const Guild = require('../database/schemas/GuildSchema')
    const { prefix, welcomeChannel, welcomeMessage, leaveChannel, modLogChannel, antiSpam, antiLinks, antiCaps } = req.body

    await Guild.findOneAndUpdate(
      { guildId: guild.id },
      {
        ...(prefix && { prefix }),
        ...(welcomeChannel !== undefined && { welcomeChannel }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(leaveChannel !== undefined && { leaveChannel }),
        ...(modLogChannel !== undefined && { modLogChannel }),
        antiSpam: antiSpam === 'on',
        antiLinks: antiLinks === 'on',
        antiCaps: antiCaps === 'on',
      },
      { upsert: true }
    )

    res.redirect(`/dashboard/${guild.id}?saved=1`)
  })

  app.listen(PORT, () => {
    console.log(`[Dashboard] Activo en ${BASE_URL} (puerto ${PORT})`.cyan)
  })
}
