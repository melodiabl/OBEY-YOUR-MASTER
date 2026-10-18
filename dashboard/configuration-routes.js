const { ConfigurationError, welcomeSettingsForm } = require('../handlers/welcome/index.js')
const { localeFor, normalizeLocale } = require('../handlers/i18n')
module.exports = (app, client, { requireAuth, requireFreshGuildPermissions, canManageGuild }) => {
  const access = (req, res, next) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, guild.id)) return res.status(403).json({ error: 'no_permission' })
    if (!client.welcomeConfiguration) return res.status(503).json({ error: 'configuration_storage' })
    if (req.params.moduleId && req.params.moduleId !== 'welcome') return res.status(404).json({ error: 'configuration_not_found' })
    req.configurationGuild = guild
    res.set('Cache-Control', 'private, no-store')
    return next()
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  const failure = error => ({ error: error instanceof ConfigurationError ? error.code : 'configuration_storage',
    ...(error instanceof ConfigurationError && error.accessRevoked ? { accessRevoked: true } : {}),
    ...(error instanceof ConfigurationError && error.fields.length ? { fields: error.fields } : {}),
  })
  const wrap = handler => async (req, res) => {
    try { return await handler(req, res) }
    catch (error) {
      const code = error instanceof ConfigurationError ? error.code : 'configuration_storage'
      if (code === 'configuration_conflict') {
        try { return res.status(409).json({ error: code, current: await client.welcomeConfiguration.read(context(req)) }) }
        catch (currentError) {
          const currentCode = currentError instanceof ConfigurationError ? currentError.code : 'configuration_storage'
          return res.status({ configuration_permissions: 403, configuration_not_found: 404 }[currentCode] || 503).json(failure(currentError))
        }
      }
      const status = { invalid_configuration: 400, configuration_permissions: 403, configuration_not_found: 404 }[code] || 503
      return res.status(status).json(failure(error))
    }
  }
  const context = req => ({ guildId: req.configurationGuild.id, actorId: req.session.user.id })
  const service = () => client.welcomeConfiguration
  app.get('/api/guilds/:guildId/modules', ...guarded, (req, res) => res.json({ modules: client.modules.list().map(manifest => ({
    id: manifest.id, version: manifest.version, capabilities: manifest.capabilities,
    configuration: manifest.configuration || null,
    permissions: Object.keys(manifest.permissions).map(name => client.modules.resolveCapability(manifest.id, name)),
  })) }))
  app.get('/configuration/:guildId/:moduleId', ...guarded, (req, res) => res.render('pages/configuration-editor', {
    user: req.session.user, guild: { id: req.configurationGuild.id, name: req.configurationGuild.name }, moduleId: req.params.moduleId,
    form: welcomeSettingsForm(normalizeLocale(localeFor(client, req.configurationGuild.id)) === 'en' ? 'en' : 'es'),
  }))
  app.get('/api/guilds/:guildId/modules/:moduleId/config', ...guarded, wrap(async (req, res) => res.json(await service().read(context(req)))))
  app.get('/api/guilds/:guildId/modules/:moduleId/channels', ...guarded, wrap(async (req, res) => {
    res.json(await service().channels(context(req)))
  }))
  app.put('/api/guilds/:guildId/modules/:moduleId/draft', ...guarded, wrap(async (req, res) => {
    res.json(await service().saveDraft(context(req), req.body))
  }))
  app.post('/api/guilds/:guildId/modules/:moduleId/preview', ...guarded, wrap(async (req, res) => {
    res.json(await service().preview(context(req), req.body))
  }))
  app.post('/api/guilds/:guildId/modules/:moduleId/publish', ...guarded, wrap(async (req, res) => {
    res.json(await service().publish(context(req), req.body))
  }))
}
