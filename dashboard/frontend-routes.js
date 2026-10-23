const express = require('express')
const fs = require('node:fs')
const path = require('node:path')
const { canManageGuild } = require('../handlers/permissions')

const snowflake = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const imageHash = value => typeof value === 'string' && /^(?:a_)?[a-f0-9]{32}$/.test(value)

module.exports = (app, client, { requireAuth, fetchGuilds, directory = path.join(__dirname, 'frontend/out') }) => {
  app.get('/api/panel/context', requireAuth, async (req, res) => {
    res.set('Cache-Control', 'private, no-store').vary('Cookie')
    const actorId = req.session.user.id
    let guilds
    try {
      guilds = await fetchGuilds(req.session.user.access_token)
      if (!Array.isArray(guilds)) throw new Error('invalid_guilds')
      if (req.session.reload) await new Promise((resolve, reject) => req.session.reload(error => error ? reject(error) : resolve()))
      if (req.session.user?.id !== actorId || req.session.user.expires_at !== undefined && req.session.user.expires_at <= Date.now()) {
        return res.status(401).json({ error: 'not_authenticated' })
      }
    } catch { return res.status(503).json({ error: 'permissions_unavailable' }) }
    req.session.user = { ...req.session.user, guilds, guilds_fetched_at: Date.now() }
    const user = req.session.user
    const manageable = guilds.filter(guild => snowflake(guild.id) && client.guilds.cache.has(guild.id) && canManageGuild(user, guild.id))
    return res.json({
      user: { id: user.id, name: String(user.global_name || user.username || 'Usuario').slice(0, 80),
        avatarUrl: snowflake(user.id) && imageHash(user.avatar) ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null },
      guilds: manageable.map(item => {
        const guild = client.guilds.cache.get(item.id)
        return { id: item.id, name: String(guild.name || item.name || 'Servidor').slice(0, 100),
          iconUrl: imageHash(item.icon) ? `https://cdn.discordapp.com/icons/${item.id}/${item.icon}.png?size=128` : null,
          memberCount: Number.isSafeInteger(guild.memberCount) ? guild.memberCount : null }
      }).sort((a, b) => a.name.localeCompare(b.name)),
      csrfToken: req.session.csrfToken || res.locals.csrfToken,
    })
  })

  // Only built assets and the single exported page are public routes. Source,
  // package files and private configuration never become a static directory.
  app.use('/app/_next', express.static(path.join(directory, '_next'), { index: false, dotfiles: 'deny', immutable: true, maxAge: '1y' }),
    (_req, res) => res.status(404).end())
  app.get(['/app', '/app/'], requireAuth, (_req, res) => {
    res.set('Cache-Control', 'private, no-store').vary('Cookie')
    const page = path.join(directory, 'index.html')
    if (!fs.existsSync(page)) return res.status(503).send('El panel se está actualizando. <a href="/panel">Abrir el panel disponible</a>.')
    return res.sendFile(page, { cacheControl: false })
  })
}
