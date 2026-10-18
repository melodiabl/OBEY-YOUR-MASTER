const { createLogConfiguration } = require('../handlers/logs/configuration')
const { logSetupDefinition } = require('../handlers/setup-logs')

module.exports = (app, client, { requireAuth, requireFreshGuildPermissions, canManageGuild }) => {
  const fields = logSetupDefinition().fields
  const access = (req, res, next) => {
    if (!client.guilds.cache.has(req.params.guildId)) return res.status(404).json({ error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, req.params.guildId)) return res.status(403).json({ error: 'setup_denied' })
    res.set('Cache-Control', 'private, no-store')
    next()
  }
  const service = req => createLogConfiguration(client, { guildId: req.params.guildId, actorId: req.session.user.id }, fields)
  const wrap = handler => async (req, res) => {
    try { await handler(req, res) }
    catch (error) {
      const codes = { setup_denied: 403, setup_resource: 400, invalid_setup: 400, setup_conflict: 409, setup_unavailable: 503, setup_storage: 503 }
      const code = Object.hasOwn(codes, error?.code) ? error.code : 'setup_storage'
      res.status(codes[code]).json({ error: code })
    }
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  app.get('/api/guilds/:guildId/logs/config', ...guarded, wrap(async (req, res) => res.json(await service(req).read())))
  app.put('/api/guilds/:guildId/logs/config', ...guarded, wrap(async (req, res) => {
    if (!req.body || Object.keys(req.body).some(key => !['patch', 'revision'].includes(key))) return res.status(400).json({ error: 'invalid_setup' })
    res.json(await service(req).save(req.params.guildId, req.body.patch, req.body.revision))
  }))
  app.post('/dashboard/:guildId/logs', ...guarded, wrap(async (req, res) => {
    const patch = { defaultChannel: req.body.defaultChannel, includeMessageContent: req.body.includeMessageContent === 'on',
      excludedChannelIds: req.body.excludedChannelIds === undefined ? [] : Array.isArray(req.body.excludedChannelIds) ? req.body.excludedChannelIds : [req.body.excludedChannelIds] }
    for (const key of ['server', 'members', 'moderation', 'messages', 'voice']) patch[key] = req.body[key] === 'inherit' ? null : req.body[key]
    await service(req).save(req.params.guildId, patch, req.body.revision)
    res.redirect(303, `/dashboard/${encodeURIComponent(req.params.guildId)}?saved=1&tab=logs`)
  }))
}
