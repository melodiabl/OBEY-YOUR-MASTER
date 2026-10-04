const { BlueprintError } = require('../handlers/architect/blueprint')
module.exports = (app, client, {
  service = client.architect,
  canManageGuild = () => false,
  requireAuth = (req, res) => res.status(401).json({ error: 'not_authenticated' }),
  requireFreshGuildPermissions = (req, res) => res.status(503).json({ error: 'permissions_unavailable' }),
} = {}) => {
  const access = (req, res, next) => {
    if (typeof req.params.guildId !== 'string') return res.status(400).json({ error: 'invalid_guild' })
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, guild.id)) return res.status(403).json({ error: 'no_permission' })
    if (!service) return res.status(503).json({ error: 'architect_unavailable' })
    req.architectGuild = guild
    res.set('Cache-Control', 'private, no-store')
    return next()
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  const wrap = handler => async (req, res) => {
    try { await handler(req, res) }
    catch (error) {
      const code = error.code
      if (['revision_conflict', 'draft_conflict'].includes(code)) return res.status(409).json({ error: code })
      if (error instanceof BlueprintError && code === 'invalid_blueprint') return res.status(400).json({ error: code, detail: error.message })
      return res.status(503).json({ error: code === 'storage_unavailable' ? code : 'architect_unavailable' })
    }
  }
  app.get('/architect/:guildId', ...guarded, (req, res) => res.render('pages/architect', {
    user: req.session.user, guild: { id: req.architectGuild.id, name: req.architectGuild.name },
  }))
  app.get('/api/architect/:guildId', ...guarded, wrap(async (req, res) => {
    res.json({ ok: true, ...(await service.read(req.architectGuild, req.session.user.id)) })
  }))
  app.post('/api/architect/:guildId/preview', ...guarded, wrap(async (req, res) => {
    res.json({ ok: true, ...(await service.preview(req.architectGuild, req.body?.blueprint, req.session.user.id)) })
  }))
  app.post('/api/architect/:guildId/draft', ...guarded, wrap(async (req, res) => {
    res.json({ ok: true, ...(await service.save(req.architectGuild, req.session.user.id, req.body?.blueprint, req.body?.expectedRevision)) })
  }))
}
