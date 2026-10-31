const express = require('express')
const fs = require('node:fs')
const path = require('node:path')
const { readFreshGuilds } = require('./permissions')
const { canManageGuild } = require('../handlers/permissions')

const snowflake = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const imageHash = value => typeof value === 'string' && /^(?:a_)?[a-f0-9]{32}$/.test(value)

module.exports = (app, client, { requireAuth, fetchGuilds, directory = path.join(__dirname, 'frontend/out') }) => {
  app.get('/api/panel/context', requireAuth, async (req, res) => {
    res.set('Cache-Control', 'private, no-store').vary('Cookie')
    let user
    try { user = await readFreshGuilds(req, fetchGuilds) }
    catch (error) { return res.status(error.code === 'not_authenticated' ? 401 : 503).json({ error: error.code === 'not_authenticated' ? 'not_authenticated' : 'permissions_unavailable' }) }
    const manageable = user.guilds.filter(guild => snowflake(guild.id) && client.guilds.cache.has(guild.id) && canManageGuild(user, guild.id))
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
