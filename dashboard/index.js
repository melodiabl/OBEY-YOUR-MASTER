const express    = require('express')
const session    = require('express-session')
const MongoStore = require('connect-mongo')
const path       = require('path')
const axios      = require('axios')
const http       = require('http')
const crypto     = require('crypto')
const { Server } = require('socket.io')

module.exports = async client => {
  const app    = express()
  const config = client.config

  const DISCORD_CLIENT_ID     = process.env.DISCORD_CLIENT_ID     || config.clientid
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
  const SESSION_SECRET        = process.env.SESSION_SECRET        || 'obey-dashboard-secret'
  const BASE_URL              = process.env.DASHBOARD_BASE_URL    || 'http://localhost:3000'
  const PORT                  = parseInt(process.env.DASHBOARD_PORT || '3002', 10)
  const MONGO_URL             = process.env.MONGO_URL || process.env.mongourl || config.mongourl
  const REDIRECT_URI          = `${BASE_URL}/auth/callback`

  if (!DISCORD_CLIENT_SECRET) {
    console.warn('[Dashboard] DISCORD_CLIENT_SECRET no configurado, dashboard desactivado.'.yellow)
    return
  }

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, 'views'))
  app.enable('view cache')
  app.set('trust proxy', 1)
  const secureCookies = /^https:\/\//i.test(BASE_URL)
  const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: secureCookies,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
    },
    store: MongoStore.create({ mongoUrl: MONGO_URL, collectionName: 'dashboard_sessions' }),
  })
  app.use(sessionMiddleware)

  // Endpoints REST de música (port de Soundy api/) — tras la sesión, para poder autenticar (evita IDOR)
  try { require('../handlers/music/apiRoutes')(app, client) } catch (e) { console.warn('[Music] apiRoutes no montados:', e?.message) }

  // ─── OAuth2 helpers ───────────────────────────────────────────────────────

  async function refreshDiscordToken(session) {
    const { refresh_token } = session.user
    if (!refresh_token) throw new Error('no_refresh_token')
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id:     DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const { access_token, refresh_token: newRefresh, expires_in } = tokenRes.data
    const [userRes, guildsRes] = await Promise.all([
      axios.get('https://discord.com/api/users/@me',        { headers: { Authorization: `Bearer ${access_token}` } }),
      axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${access_token}` } }),
    ])
    session.user = {
      ...userRes.data,
      guilds:        guildsRes.data,
      access_token,
      refresh_token: newRefresh,
      expires_at:    Date.now() + expires_in * 1000,
    }
  }

  // Auth middleware — validates session + refreshes Discord token if near expiry
  const requireAuth = async (req, res, next) => {
    if (!req.session?.user) return res.redirect('/login?reason=not_logged_in')
    const user = req.session.user
    // If token expires within 1 hour, refresh proactively
    if (user.expires_at && Date.now() > user.expires_at - 3600_000) {
      try {
        await refreshDiscordToken(req.session)
      } catch {
        // Discord revoked access — force re-login
        req.session.destroy(() => {})
        return res.redirect('/login?reason=session_expired')
      }
    }
    next()
  }

  function canManageGuild(user, guildId) {
    const guild = user?.guilds?.find(item => item.id === guildId)
    if (!guild) return false
    if (guild.owner) return true
    try {
      const permissions = BigInt(guild.permissions || 0)
      return (permissions & BigInt(0x8)) === BigInt(0x8)
        || (permissions & BigInt(0x20)) === BigInt(0x20)
    } catch {
      return false
    }
  }

  // ─── Public routes ────────────────────────────────────────────────────────

  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

  app.get('/login', (req, res) => {
    const state = crypto.randomBytes(24).toString('hex')
    req.session.oauthState = state
    const params = new URLSearchParams({
      client_id:     DISCORD_CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         'identify guilds',
      state,
    })
    req.session.save(err => {
      if (err) {
        console.error('[Dashboard] No se pudo iniciar la sesión OAuth:', err.message)
        return res.redirect('/?error=session_failed')
      }
      res.redirect(`https://discord.com/oauth2/authorize?${params}`)
    })
  })

  app.get('/auth/callback', async (req, res) => {
    const { code, state, error } = req.query
    if (error) return res.redirect(`/?error=${encodeURIComponent(error)}`)
    if (!code) return res.redirect('/?error=no_code')
    if (!state || state !== req.session?.oauthState) return res.redirect('/?error=invalid_state')
    delete req.session.oauthState
    try {
      const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id:     DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

      const { access_token, refresh_token, expires_in } = tokenRes.data
      const [userRes, guildsRes] = await Promise.all([
        axios.get('https://discord.com/api/users/@me',        { headers: { Authorization: `Bearer ${access_token}` } }),
        axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${access_token}` } }),
      ])
      req.session.user = {
        ...userRes.data,
        guilds:        guildsRes.data,
        access_token,
        refresh_token,
        expires_at:    Date.now() + expires_in * 1000,
        logged_in_at:  Date.now(),
      }
      res.redirect('/dashboard')
    } catch (e) {
      res.redirect('/?error=auth_failed')
    }
  })

  app.get('/logout', (req, res) => {
    // Revoke Discord token before destroying session
    const token = req.session?.user?.access_token
    if (token) {
      axios.post('https://discord.com/api/oauth2/token/revoke', new URLSearchParams({
        client_id:     DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        token,
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).catch(() => {})
    }
    req.session.destroy(() => res.redirect('/'))
  })

  // ─── Panel home ───────────────────────────────────────────────────────────

  app.get('/panel', requireAuth, (req, res) => {
    res.render('pages/home', {
      user:       req.session.user,
      activePage: 'home',
      bot:        { guilds: client.guilds.cache.size, commands: 625 },
      breadcrumb: [{ label: 'Panel de control' }],
    })
  })

  // ─── Refresh guilds (AJAX) ────────────────────────────────────────────────

  app.post('/api/refresh-guilds', requireAuth, async (req, res) => {
    try {
      const { access_token } = req.session.user
      const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      req.session.user.guilds           = guildsRes.data
      req.session.user.guilds_fetched_at = Date.now()
      res.json({ ok: true, count: guildsRes.data.length })
    } catch {
      res.json({ ok: false })
    }
  })

  // ─── SSE — stats en tiempo real ───────────────────────────────────────────

  const sseCache = { data: null, lastUpdated: 0 }
  function computeStats() {
    const now = Date.now()
    if (sseCache.data && now - sseCache.lastUpdated < 1000) return sseCache.data
    const mem = process.memoryUsage()
    sseCache.data = {
      guilds:        client.guilds.cache.size,
      users:         client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0),
      activePlayers: client.shoukaku?.players?.size ?? 0,
      uptime:        Math.floor(process.uptime()),
      memUsed:       Math.round(mem.heapUsed  / 1024 / 1024),
      memTotal:      Math.round(mem.heapTotal  / 1024 / 1024),
      rss:           Math.round(mem.rss        / 1024 / 1024),
      ping:          Math.round(client.ws.ping),
      updatedAt:     now,
    }
    sseCache.lastUpdated = now
    return sseCache.data
  }

  app.get('/api/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = () => {
      try { res.write(`data: ${JSON.stringify(computeStats())}\n\n`) } catch {}
    }

    send()
    const iv = setInterval(send, 5000)
    req.on('close', () => clearInterval(iv))
  })

  // ─── Stats JSON (legacy polling) ─────────────────────────────────────────

  app.get('/api/stats', (req, res) => {
    const stats = computeStats()
    res.json({ ...stats, uptime: process.uptime() })
  })

  app.get('/api/nowplaying', (req, res) => {
    const tracks = []
    if (client.music?.playerStates) {
      for (const [guildId, state] of client.music.playerStates) {
        const track = state?.currentTrack
        const guild = client.guilds.cache.get(guildId)
        if (!track || !guild) continue
        const info = track.info || track
        tracks.push({
          guildId,
          guildName:   guild.name,
          trackTitle:  info.title  || '?',
          trackAuthor: info.author || '',
          thumbnail:   info.artworkUrl || info.thumbnail || null,
          uri:         info.uri || null,
        })
      }
    }
    res.json({ tracks })
  })

  // ─── Invite leaderboard ───────────────────────────────────────────────────

  app.get('/api/invites/:guildId', requireAuth, (req, res) => {
    const { guildId } = req.params
    if (!canManageGuild(req.session.user, guildId))
      return res.status(403).json({ ok: false, error: 'no_permission' })
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return res.json({ ok: false, leaderboard: [] })

    const all = client.invitesdb?.array() || []
    const entries = all
      .filter(e => e.guildId === guildId && !e.bot)
      .map(e => {
        const member = guild.members.cache.get(e.id)
        return {
          id:       e.id,
          username: member?.user?.username || `Unknown (${e.id})`,
          avatar:   member?.user?.displayAvatarURL({ extension: 'png', size: 64, forceStatic: true }) || null,
          invites:  Math.max(0, (e.invites || 0) - (e.fake || 0) - (e.leaves || 0)),
          total:    e.invites  || 0,
          fake:     e.fake     || 0,
          leaves:   e.leaves   || 0,
        }
      })
      .sort((a, b) => b.invites - a.invites)
      .slice(0, 20)

    res.json({ ok: true, leaderboard: entries })
  })

  // ─── Dashboard — server list ──────────────────────────────────────────────

  app.get('/dashboard', requireAuth, async (req, res) => {
    // Auto-refresh guild list if older than 60 seconds
    const lastFetch = req.session.user.guilds_fetched_at || 0
    if (Date.now() - lastFetch > 60_000) {
      try {
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${req.session.user.access_token}` },
        })
        // Reassign whole user object so MongoStore detects the change
        req.session.user = { ...req.session.user, guilds: guildsRes.data, guilds_fetched_at: Date.now() }
        await new Promise((ok, fail) => req.session.save(e => e ? fail(e) : ok()))
      } catch { /* use cached guilds if Discord API fails */ }
    }

    const userGuilds = req.session.user.guilds || []
    // Show servers where user is owner OR has Manage Server OR Administrator
    const manageable = userGuilds.filter(g => {
      if (g.owner) return true
      const perms = BigInt(g.permissions || 0)
      return (perms & BigInt(0x8)) === BigInt(0x8)   // ADMINISTRATOR
          || (perms & BigInt(0x20)) === BigInt(0x20)  // MANAGE_GUILD
    })
    const botGuilds  = manageable.map(g => ({
      ...g,
      inBot: client.guilds.cache.has(g.id),
      icon:  g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
    }))
    res.render('pages/dashboard', {
      user:     req.session.user,
      guilds:   botGuilds,
      clientId: DISCORD_CLIENT_ID,
    })
  })

  // ─── Guild settings GET ───────────────────────────────────────────────────

  app.get('/dashboard/:guildId', requireAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.redirect(
      `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot&guild_id=${req.params.guildId}&permissions=8`
    )

    if (!canManageGuild(req.session.user, req.params.guildId))
      return res.redirect('/dashboard?error=no_permission')

    const Guild    = require('../database/schemas/GuildSchema')
    const settings = await Guild.findOne({ guildId: guild.id }) || {}
    const allCh    = [...guild.channels.cache.values()]

    res.render('pages/guild', {
      user:     req.session.user,
      guild:    { id: guild.id, name: guild.name, icon: guild.iconURL(), memberCount: guild.memberCount },
      settings,
      saved:    req.query.saved === '1',
      channels:   allCh.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })).sort((a,b)=>a.name.localeCompare(b.name)),
      categories: allCh.filter(c => c.type === 4).map(c => ({ id: c.id, name: c.name })).sort((a,b)=>a.name.localeCompare(b.name)),
      roles:    guild.roles.cache.filter(r => !r.managed && r.id !== guild.id)
                  .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
                  .sort((a,b) => b.position - a.position),
      breadcrumb: [{ label: 'Mis Servidores', url: '/dashboard' }, { label: guild.name }],
    })
  })

  // ─── Guild settings POST ──────────────────────────────────────────────────

  app.post('/dashboard/:guildId', requireAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'Guild not found' })

    if (!canManageGuild(req.session.user, req.params.guildId))
      return res.status(403).json({ error: 'No permission' })

    const Guild = require('../database/schemas/GuildSchema')
    const b     = req.body
    const patch = {}

    // General
    if (b.prefix)                patch.prefix   = String(b.prefix).slice(0, 5)
    if (b.language)              patch.language = ['es','en'].includes(b.language) ? b.language : 'es'
    if (b.memberCount !== undefined) patch.memberCount = b.memberCount || null
    patch.autoEmbed = b.autoEmbed === 'on'
    patch.autoMeme  = b.autoMeme  === 'on'

    // Moderation
    if (b.modLogChannel !== undefined) patch.modLogChannel = b.modLogChannel || null
    if (b.muteRole      !== undefined) patch.muteRole      = b.muteRole      || null
    patch.antiSpam  = b.antiSpam  === 'on'
    patch.antiLinks = b.antiLinks === 'on'
    patch.antiCaps  = b.antiCaps  === 'on'

    // Anti-discord (invite links filter)
    patch.antiDiscord         = b.antiDiscord      === 'on'
    if (b.antiDiscordMute !== undefined)
      patch.antiDiscordMute   = Math.max(1, Math.min(10, parseInt(b.antiDiscordMute) || 2))

    // Anti-mention
    patch.antiMention         = b.antiMention      === 'on'
    if (b.antiMentionLimit !== undefined)
      patch.antiMentionLimit  = Math.max(2, Math.min(20, parseInt(b.antiMentionLimit) || 5))

    // Anti-selfbot
    patch.antiSelfbot = b.antiSelfbot === 'on'

    // Welcome / leave
    if (b.welcomeChannel !== undefined) patch.welcomeChannel = b.welcomeChannel || null
    if (b.welcomeMessage !== undefined) patch.welcomeMessage = String(b.welcomeMessage || '').slice(0, 500)
    if (b.leaveChannel   !== undefined) patch.leaveChannel   = b.leaveChannel   || null
    if (b.leaveMessage   !== undefined) patch.leaveMessage   = String(b.leaveMessage   || '').slice(0, 500)

    // Music
    if (b.musicChannel  !== undefined) patch.musicChannel  = b.musicChannel  || null
    if (b.defaultVolume)               patch.defaultVolume = Math.max(1, Math.min(200, parseInt(b.defaultVolume) || 100))
    patch.autoplay = b.autoplay === 'on'

    // DJ role + birthday
    if (b.djRole          !== undefined) patch.djRole          = b.djRole          || null
    if (b.birthdayChannel !== undefined) patch.birthdayChannel = b.birthdayChannel || null

    // Misc
    if (b.autoNsfwEnabled !== undefined) patch.autoNsfw = b.autoNsfwEnabled === 'on' ? 'enabled' : null

    // Log channels
    if (b['log_messages']   !== undefined) patch['logChannels.messages']   = b['log_messages']   || null
    if (b['log_members']    !== undefined) patch['logChannels.members']    = b['log_members']    || null
    if (b['log_moderation'] !== undefined) patch['logChannels.moderation'] = b['log_moderation'] || null
    if (b['log_voice']      !== undefined) patch['logChannels.voice']      = b['log_voice']      || null
    if (b['log_server']     !== undefined) patch['logChannels.server']     = b['log_server']     || null

    // Build bot-format paths
    const botPatch = {}
    if (patch.prefix   !== undefined) botPatch.prefix   = patch.prefix
    if (patch.language !== undefined) botPatch.language = patch.language
    if (patch.welcomeChannel !== undefined) botPatch['welcome.channel'] = patch.welcomeChannel || 'nochannel'
    if (patch.welcomeMessage !== undefined) botPatch['welcome.message'] = patch.welcomeMessage
    if (patch.leaveChannel   !== undefined) botPatch['leave.channel']   = patch.leaveChannel   || 'nochannel'
    if (patch.leaveMessage   !== undefined) botPatch['leave.msg']       = patch.leaveMessage
    if (patch.muteRole       !== undefined) botPatch['mute.roleId']     = patch.muteRole       || null
    if (patch.antiSpam  !== undefined) { botPatch['autowarn.antispam']  = patch.antiSpam;  botPatch['antispam.enabled']  = patch.antiSpam  ? 1 : 0 }
    if (patch.antiLinks !== undefined) { botPatch['autowarn.antilinks'] = patch.antiLinks; botPatch['antilink.enabled']  = patch.antiLinks ? 1 : 0 }
    if (patch.antiCaps  !== undefined) { botPatch['autowarn.anticaps']  = patch.antiCaps;  botPatch['anticaps.enabled']  = patch.antiCaps  ? 1 : 0 }
    if (patch.antiDiscord  !== undefined) { botPatch['antidiscord.enabled']  = patch.antiDiscord;  botPatch['autowarn.antidiscord']  = patch.antiDiscord }
    if (patch.antiDiscordMute !== undefined) botPatch['antidiscord.mute_amount'] = patch.antiDiscordMute
    if (patch.antiMention !== undefined) { botPatch['antimention.enabled'] = patch.antiMention; botPatch['autowarn.antimention'] = patch.antiMention }
    if (patch.antiMentionLimit !== undefined) botPatch['antimention.limit'] = patch.antiMentionLimit
    if (patch.antiSelfbot !== undefined) { botPatch['antiselfbot.enabled'] = patch.antiSelfbot; botPatch['autowarn.antiselfbot'] = patch.antiSelfbot }
    if (patch.djRole          !== undefined) botPatch.djroles         = patch.djRole ? [patch.djRole] : []
    if (patch.birthdayChannel !== undefined) botPatch.birthdayChannel = patch.birthdayChannel
    if (patch.modLogChannel   !== undefined) botPatch['logChannels.moderation'] = patch.modLogChannel || null

    await Guild.findOneAndUpdate({ guildId: guild.id }, { $set: { ...patch, ...botPatch } }, { upsert: true })

    // Sync in-memory cache
    const gid = guild.id
    const s   = client.settings

    if (patch.prefix   !== undefined) s.set(gid, patch.prefix,   'prefix')
    if (patch.language !== undefined) s.set(gid, patch.language, 'language')
    if (patch.welcomeChannel !== undefined) s.set(gid, patch.welcomeChannel || 'nochannel', 'welcome.channel')
    if (patch.welcomeMessage !== undefined) s.set(gid, patch.welcomeMessage, 'welcome.message')
    if (patch.leaveChannel   !== undefined) s.set(gid, patch.leaveChannel   || 'nochannel', 'leave.channel')
    if (patch.leaveMessage   !== undefined) s.set(gid, patch.leaveMessage,   'leave.msg')
    if (patch.muteRole       !== undefined) s.set(gid, patch.muteRole        || null, 'mute.roleId')
    if (patch.modLogChannel  !== undefined) s.set(gid, patch.modLogChannel   || null, 'logChannels.moderation')

    s.ensure(gid, { antispam: {}, antilink: {}, anticaps: {}, antidiscord: {}, antimention: {}, antiselfbot: {}, autowarn: {} })
    s.set(gid, patch.antiSpam,  'autowarn.antispam')
    s.set(gid, patch.antiLinks, 'autowarn.antilinks')
    s.set(gid, patch.antiCaps,  'autowarn.anticaps')
    s.set(gid, patch.antiSpam  ? 1 : 0, 'antispam.enabled')
    s.set(gid, patch.antiLinks ? 1 : 0, 'antilink.enabled')
    s.set(gid, patch.antiCaps  ? 1 : 0, 'anticaps.enabled')
    s.set(gid, patch.antiDiscord,  'antidiscord.enabled')
    s.set(gid, patch.antiDiscord,  'autowarn.antidiscord')
    if (patch.antiDiscordMute !== undefined) s.set(gid, patch.antiDiscordMute, 'antidiscord.mute_amount')
    s.set(gid, patch.antiMention,  'antimention.enabled')
    s.set(gid, patch.antiMention,  'autowarn.antimention')
    if (patch.antiMentionLimit !== undefined) s.set(gid, patch.antiMentionLimit, 'antimention.limit')
    s.set(gid, patch.antiSelfbot,  'antiselfbot.enabled')
    s.set(gid, patch.antiSelfbot,  'autowarn.antiselfbot')

    if (patch.musicChannel !== undefined && client.musicsettings)
      client.musicsettings.set(gid, patch.musicChannel || null, 'channel')

    if (patch.djRole !== undefined) s.set(gid, patch.djRole ? [patch.djRole] : [], 'djroles')
    if (patch.autoEmbed !== undefined) s.set(gid, patch.autoEmbed ? (s.get(gid, 'autoembed') || []) : [], 'autoembed')
    if (patch.autoMeme  !== undefined) s.set(gid, patch.autoMeme  ? 'enabled' : 'disabled', 'automeme')
    if (patch.birthdayChannel !== undefined) s.set(gid, patch.birthdayChannel, 'birthdayChannel')

    if (patch['logChannels.messages']   !== undefined) s.set(gid, patch['logChannels.messages'],   'logChannels.messages')
    if (patch['logChannels.members']    !== undefined) s.set(gid, patch['logChannels.members'],    'logChannels.members')
    if (patch['logChannels.moderation'] !== undefined) s.set(gid, patch['logChannels.moderation'], 'logChannels.moderation')
    if (patch['logChannels.voice']      !== undefined) s.set(gid, patch['logChannels.voice'],      'logChannels.voice')
    if (patch['logChannels.server']     !== undefined) s.set(gid, patch['logChannels.server'],     'logChannels.server')

    const tab = b._activeTab ? `&tab=${encodeURIComponent(b._activeTab)}` : ''
    res.redirect(`/dashboard/${guild.id}?saved=1${tab}`)
  })

  // ─── Stats page ────────────────────────────────────────────────────────────

  app.get('/stats/:guildId', requireAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.redirect('/dashboard')
    if (!canManageGuild(req.session.user, req.params.guildId))
      return res.redirect('/dashboard?error=no_permission')

    let onlineCount = 0, idleCount = 0, dndCount = 0
    try {
      await guild.members.fetch()
      for (const [, m] of guild.members.cache) {
        const st = m.presence?.status || 'offline'
        if      (st === 'online') onlineCount++
        else if (st === 'idle')   idleCount++
        else if (st === 'dnd')    dndCount++
      }
    } catch {}

    const allCh = [...guild.channels.cache.values()]
    const Guild  = require('../database/schemas/GuildSchema')
    const gd     = await Guild.findOne({ guildId: guild.id }).lean() || {}
    const warnCount = Object.keys(gd.warns || {}).reduce((a,k) => a + (Array.isArray(gd.warns[k]) ? gd.warns[k].length : 0), 0)

    const topRoles = guild.roles.cache
      .filter(r => r.id !== guild.id && !r.managed && r.members.size > 0)
      .map(r => ({ name: r.name, color: r.hexColor !== '#000000' ? r.hexColor : '#5865F2', count: r.members.size }))
      .sort((a,b) => b.count - a.count).slice(0, 8)

    // Top inviters
    const inviteEntries = (client.invitesdb?.array() || [])
      .filter(e => e.guildId === guild.id && !e.bot)
      .map(e => {
        const m = guild.members.cache.get(e.id)
        return {
          id:       e.id,
          username: m?.user?.username || `Unknown`,
          avatar:   m?.user?.displayAvatarURL({ extension:'png', size:64, forceStatic:true }) || null,
          invites:  Math.max(0, (e.invites||0)-(e.fake||0)-(e.leaves||0)),
          total:    e.invites||0,
          fake:     e.fake||0,
          leaves:   e.leaves||0,
        }
      })
      .sort((a,b) => b.invites - a.invites)
      .slice(0, 10)

    res.render('pages/stats', {
      user: req.session.user,
      breadcrumb: [
        { label: 'Mis Servidores', url: '/dashboard' },
        { label: guild.name, url: `/dashboard/${guild.id}` },
        { label: 'Estadísticas' },
      ],
      guild: {
        id: guild.id, name: guild.name, icon: guild.iconURL(), memberCount: guild.memberCount,
        onlineCount, idleCount, dndCount,
        offlineCount: guild.memberCount - onlineCount - idleCount - dndCount,
        textChannels:  allCh.filter(c => c.type === 0).length,
        voiceChannels: allCh.filter(c => c.type === 2).length,
        categories:    allCh.filter(c => c.type === 4).length,
        otherChannels: allCh.filter(c => ![0,2,4].includes(c.type)).length,
        channelCount:  allCh.length,
        roleCount:     guild.roles.cache.size,
        warnCount,
        ticketCount:   gd.ticketCount || 0,
      },
      topRoles,
      inviteLeaderboard: inviteEntries,
    })
  })

  // ─── Player page ───────────────────────────────────────────────────────────

  // /player migrado a /music (la app completa). Redirección permanente.
  app.get('/player/:guildId', requireAuth, (req, res) => res.redirect('/music/' + req.params.guildId))

  // ─── Música (experiencia completa: hero, raíles, reproductor en vivo) ────────
  app.get('/music/:guildId', requireAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.redirect('/dashboard')
    if (!canManageGuild(req.session.user, req.params.guildId))
      return res.redirect('/dashboard?error=no_permission')
    const u = req.session.user
    const avatarUrl = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`
      : `https://cdn.discordapp.com/embed/avatars/0.png`
    let prefix = '!'
    try { prefix = client.settings.get(req.params.guildId, 'prefix') || config.prefix || process.env.PREFIX || '!' } catch {}
    res.render('pages/music', {
      layout: false,
      guild: { id: guild.id, name: guild.name, icon: guild.iconURL() },
      muser: { username: u.username, avatarUrl },
      prefix,
    })
  })

  // ─── Mi Biblioteca (favoritos/playlists/recientes/top) ───────────────────────
  app.get('/library/:guildId', requireAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.redirect('/dashboard')
    if (!canManageGuild(req.session.user, req.params.guildId))
      return res.redirect('/dashboard?error=no_permission')
    res.render('pages/library', {
      user: req.session.user,
      breadcrumb: [
        { label: 'Mis Servidores', url: '/dashboard' },
        { label: guild.name, url: `/dashboard/${guild.id}` },
        { label: 'Mi Biblioteca' },
      ],
      guild: { id: guild.id, name: guild.name, icon: guild.iconURL() },
    })
  })

  // ─── Player API ─────────────────────────────────────────────────────────────

  app.get('/api/player/:guildId', requireAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.json({ error: 'guild_not_found' })
    const music = client.music
    if (!music) return res.json({ active: false })
    res.json(music.getPublicState?.(req.params.guildId) || { active: false })
  })

  app.post('/api/player/:guildId/action', requireAuth, async (req, res) => {
    const guildId   = req.params.guildId
    const guild     = client.guilds.cache.get(guildId)
    if (!guild) return res.json({ ok: false, error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ ok: false, error: 'no_permission' })

    const { action, value } = req.body
    const music = client.music
    if (!music) return res.json({ ok: false, error: 'no_music' })

    try {
      switch (action) {
        case 'pause':    await music.pause(guildId);                 break
        case 'skip':     await music.skip(guildId);                  break
        case 'previous': await music.previous(guildId);              break
        case 'stop':     await music.stop(guildId);                  break
        case 'shuffle':  await music.shuffle(guildId);               break
        case 'autoplay': music.setAutoplay(guildId);                  break
        case 'loop':     music.setLoop(guildId, value || 'none');    break
        case 'volume':   await music.setVolume(guildId, parseInt(value) || 100); break
        case 'remove':   await music.remove(guildId, parseInt(value));           break
        case 'jump':     await music.jump(guildId, parseInt(value));             break
        case 'move':     await music.move(guildId, parseInt(value?.from), parseInt(value?.to)); break
        case 'seek':     await music.seek(guildId, parseInt(value) || 0); break
        default: return res.json({ ok: false, error: 'unknown_action' })
      }
      res.json({ ok: true })
    } catch (e) {
      res.json({ ok: false, error: e.message || String(e) })
    }
  })

  app.get('/api/player/:guildId/top-tracks', requireAuth, async (req, res) => {
    const guildId   = req.params.guildId
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ tracks: [] })
    try {
      const MusicHistory = require('../database/schemas/MusicHistorySchema')
      const tracks = await MusicHistory.find({ guildId }).sort({ plays: -1 }).limit(12).lean()
      res.json({
        tracks: tracks.map(t => ({
          type: 'track',
          title: t.title,
          author: t.author,
          artworkUrl: t.artworkUrl,
          length: t.length,
          uri: t.uri,
          plays: t.plays,
          sourceName: t.sourceName,
          albumName: t.albumName,
          releaseDate: t.releaseDate,
          isrc: t.isrc,
          requester: t.requester,
        })),
      })
    } catch {
      res.json({ tracks: [] })
    }
  })

  app.get('/api/player/:guildId/voice-channels', requireAuth, (req, res) => {
    const guildId   = req.params.guildId
    if (!canManageGuild(req.session.user, guildId))
      return res.status(403).json({ channels: [], error: 'forbidden' })
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return res.json({ channels: [] })
    const channels = guild.channels.cache
      .filter(c => c.type === 2)
      .sort((a, b) => a.position - b.position)
      .map(c => ({ id: c.id, name: c.name, members: c.members.size }))
    res.json({ channels: [...channels.values()] })
  })

  app.post('/api/player/:guildId/preview', requireAuth, async (req, res) => {
    const guildId   = req.params.guildId
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ ok: false, error: 'no_permission' })
    const { uri } = req.body
    if (!uri) return res.json({ ok: false, error: 'no_uri' })
    const music = client.music
    if (!music) return res.json({ ok: false, error: 'no_music' })
    try {
      const { normalizePublicTrack } = require('../handlers/music/utils')
      const LEO = 'http://140.245.242.153:8081'

      // Spotify album URL → Lavalink puede resolverlo como playlist con encoded
      // También acepta el formato legacy spotify:album:{id}
      const albumMatch = uri.match(/^(?:spotify:album:|https:\/\/open\.spotify\.com\/album\/)([A-Za-z0-9]+)/)
      if (albumMatch) {
        const albumId = albumMatch[1]
        const albumData = await new Promise(resolve => {
          http.get(`${LEO}/api/resolve?url=https://open.spotify.com/album/${albumId}`, { timeout: 8000 }, r => {
            let d = ''; r.on('data', c => d += c)
            r.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(null) } })
          }).on('error', () => resolve(null)).on('timeout', () => resolve(null))
        })
        if (!albumData?.items?.length) return res.json({ ok: false, error: 'not_a_collection' })
        const tracks = albumData.items.map(t => ({
          title:      t.title,
          author:     Array.isArray(t.artists) ? t.artists[0] : t.artists || '',
          artworkUrl: t.artwork || albumData.artwork || null,
          length:     t.duration || 0,
          uri:        `https://open.spotify.com/track/${t.id}`,
          sourceName: 'spotify',
          isrc:       t.isrc || null,
        }))
        return res.json({ ok: true, title: albumData.name || 'Álbum', tracks })
      }

      const result = await music.search(uri, req.session.user.username)
      if (!result || !['playlist', 'album'].includes(result.loadType) || !result.tracks?.length) {
        return res.json({ ok: false, error: 'not_a_collection' })
      }
      const tracks = result.tracks.map(t => normalizePublicTrack(t))
      res.json({ ok: true, title: result.playlistName || 'Colección', tracks })
    } catch (e) {
      res.json({ ok: false, error: e.message || String(e) })
    }
  })

  app.post('/api/player/:guildId/search', requireAuth, async (req, res) => {
    const guildId   = req.params.guildId
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ results: [], error: 'no_permission' })
    const { query, kind = 'all' } = req.body
    if (!query) return res.json({ results: [] })
    const music = client.music
    if (!music) return res.json({ results: [] })
    try {
      const { normalizePublicTrack } = require('../handlers/music/utils')
      const LEO = 'http://140.245.242.153:8081'

      function leoGet(path) {
        return new Promise((resolve, reject) => {
          http.get(`${LEO}${path}`, { timeout: 6000 }, r => {
            let d = ''; r.on('data', c => d += c)
            r.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve([]) } })
          }).on('error', () => resolve([])).on('timeout', () => resolve([]))
        })
      }

      const [result, albumsRaw] = await Promise.all([
        music.search(query, req.session.user.username),
        leoGet(`/api/search/albums?q=${encodeURIComponent(query)}&limit=10`),
      ])

      const tracks = (result?.tracks || []).map(t => normalizePublicTrack(t))

      const albumList = Array.isArray(albumsRaw) ? albumsRaw : []
      const resolved  = await Promise.all(
        albumList.map(a => leoGet(`/api/resolve?url=https://open.spotify.com/album/${a.id}`))
      )
      const albums = albumList.map((a, i) => ({
        type: 'album', title: a.name, author: a.author,
        uri: `https://open.spotify.com/album/${a.id}`,
        artworkUrl: resolved[i]?.artwork || null,
        sourceName: 'spotify',
      }))

      res.json({ results: tracks, tracks, albums })
    } catch (e) {
      res.json({ results: [], tracks: [], albums: [], error: e.message })
    }
  })

  app.post('/api/player/:guildId/add', requireAuth, async (req, res) => {
    const guildId   = req.params.guildId
    const guild     = client.guilds.cache.get(guildId)
    if (!guild) return res.json({ ok: false, error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ ok: false, error: 'no_permission' })
    const { uri, voiceChannelId } = req.body
    if (!uri) return res.json({ ok: false, error: 'no_uri' })
    const music = client.music
    if (!music) return res.json({ ok: false, error: 'no_music' })

    let vcId = null
    if (voiceChannelId) {
      const vc = guild.channels.cache.get(voiceChannelId)
      if (!vc || vc.type !== 2) return res.json({ ok: false, error: 'invalid_voice_channel' })
      vcId = voiceChannelId
    } else {
      vcId = music.getState(guildId)?.voiceChannelId
    }
    if (!vcId) return res.json({ ok: false, error: 'no_voice_channel' })

    try {
      const textChannelId = music.getState(guildId)?.textChannelId || guild.systemChannelId || ''
      let result = await music.play(guildId, vcId, textChannelId, uri, req.session.user.username)
      // If direct URI failed (deleted/unavailable), try fallback search by title from history
      if (!result) {
        const MusicHistory = require('../database/schemas/MusicHistorySchema')
        const hist = await MusicHistory.findOne({ guildId, uri }).lean().catch(() => null)
        if (hist?.title) {
          result = await music.play(guildId, vcId, textChannelId, `${hist.title} ${hist.author || ''}`.trim(), req.session.user.username).catch(() => null)
        }
      }
      if (!result) return res.json({ ok: false, error: 'no_results' })
      const isPlaylist  = result.result?.loadType === 'playlist'
      const nowPlaying  = !!result.state?.currentTrack && result.state.currentTrack?.info?.uri === result.result?.tracks?.[0]?.info?.uri
      res.json({ ok: true, added: isPlaylist ? result.result.tracks.length : 1, nowPlaying, playlistName: result.result?.playlistName })
    } catch (e) {
      res.json({ ok: false, error: e.message || String(e) })
    }
  })

  // ─── Socket.IO — Player state en tiempo real ────────────────────
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: { origin: BASE_URL, credentials: true },
    cookie: true,
  })

  io.engine.use(sessionMiddleware)

  // Auth: usar exactamente la misma sesión validada por Express.
  io.use((socket, next) => {
    if (!socket.request?.session?.user) return next(new Error('Unauthorized'))
    next()
  })

  io.on('connection', socket => {
    socket.on('join', guildId => {
      if (!guildId) return
      if (!canManageGuild(socket.request.session?.user, guildId)) {
        socket.emit('player:error', { error: 'no_permission' })
        return
      }
      socket.join(guildId)
      socket.emit('player:state', client.music?.getPublicState?.(guildId) || { active: false })
    })
    socket.on('leave', guildId => {
      if (guildId) socket.leave(guildId)
    })
  })

  // Escuchar cambios de estado del player y emitir por Socket.IO
  client.on('playerStateUpdate', guildId => {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return
    const music = client.music
    if (!music) return
    io.to(guildId).emit('player:state', music.getPublicState?.(guildId) || { active: false })
  })

  // Tick de posición cada 2s — solo guilds con reproductores activos y sin pausa
  setInterval(() => {
    const music = client.music
    if (!music?.playerStates) return
    for (const [guildId, state] of music.playerStates) {
      if (!state.currentTrack || state.paused) continue
      const rooms = io.sockets.adapter.rooms.get(guildId)
      if (!rooms?.size) continue
      const player = client.shoukaku?.players?.get(guildId)
      const info   = state.currentTrack?.info || state.currentTrack
      const len    = Number(info?.length || 0)
      // startedAt se mantiene sincronizado con Lavalink vía el evento 'update' del player;
      // player.position es un snapshot stale (hasta ~5s viejo) y hace rebotar la barra
      const elapsed = state.startedAt
        ? Math.min(len, Date.now() - state.startedAt)
        : Math.min(len, Number(player?.position ?? state.lastPosition ?? 0))
      io.to(guildId).emit('player:tick', { elapsed, length: len })
    }
  }, 2000)

  server.listen(PORT, () => {
    console.log(`[Dashboard] Activo en ${BASE_URL} (puerto ${PORT})`.cyan)
  })
}
