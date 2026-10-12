const { ConfigurationError } = require('../handlers/welcome-configuration')
const { assertWelcomeChannel } = require('../handlers/welcome-access')
const { validatePatch } = require('../handlers/welcome-configuration')
module.exports = (app, client, { requireAuth, requireFreshGuildPermissions, canManageGuild }) => {
  const access = (req, res, next) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, guild.id)) return res.status(403).json({ error: 'no_permission' })
    if (!client.moduleConfiguration) return res.status(503).json({ error: 'configuration_storage' })
    if (req.params.moduleId && !Object.hasOwn(client.moduleConfiguration.supported, req.params.moduleId)) return res.status(404).json({ error: 'configuration_not_found' })
    req.configurationGuild = guild
    res.set('Cache-Control', 'private, no-store')
    return next()
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  const wrap = handler => async (req, res) => {
    try { return await handler(req, res) }
    catch (error) {
      const code = error instanceof ConfigurationError ? error.code : 'configuration_storage'
      if (code === 'configuration_conflict') {
        try { return res.status(409).json({ error: code, current: await client.moduleConfiguration.read(req.params.guildId, req.params.moduleId) }) }
        catch { return res.status(503).json({ error: 'configuration_storage' }) }
      }
      const status = { invalid_configuration: 400, configuration_permissions: 403, configuration_not_found: 404 }[code] || 503
      return res.status(status).json({ error: code })
    }
  }
  const fields = (body, allowed) => {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== allowed.length || Object.keys(body).some(key => !allowed.includes(key))) throw new ConfigurationError('Solicitud inválida.', 'invalid_configuration')
  }
  const service = () => client.moduleConfiguration
  app.get('/api/guilds/:guildId/modules', ...guarded, (req, res) => res.json({ modules: client.modules.list().map(manifest => ({
    id: manifest.id, version: manifest.version, capabilities: manifest.capabilities,
    configuration: manifest.configuration || null,
    permissions: Object.keys(manifest.permissions).map(name => client.modules.resolveCapability(manifest.id, name)),
  })) }))
  app.get('/configuration/:guildId/:moduleId', ...guarded, (req, res) => res.render('pages/module-configuration', {
    user: req.session.user, guild: { id: req.configurationGuild.id, name: req.configurationGuild.name }, moduleId: req.params.moduleId,
  }))
  app.get('/api/guilds/:guildId/modules/:moduleId/config', ...guarded, wrap(async (req, res) => res.json(await service().read(req.params.guildId, req.params.moduleId))))
  app.get('/api/guilds/:guildId/modules/:moduleId/channels', ...guarded, wrap(async (req, res) => {
    const guild = req.configurationGuild
    const [channels, actor] = await Promise.all([guild.channels.fetch(), guild.members.fetch({ user: req.session.user.id, force: true })])
    res.json({ channels: [...channels.values()].filter(channel => channel.type === 0 && channel.permissionsFor(actor)?.has('ViewChannel')).map(({ id, name }) => ({ id, name })) })
  }))
  app.put('/api/guilds/:guildId/modules/:moduleId/draft', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['config', 'expectedDraftRevision', 'expectedPublishedRevision'])
    res.json(await service().saveDraft(req.params.guildId, req.params.moduleId, req.session.user.id, req.body.config, req.body.expectedDraftRevision, req.body.expectedPublishedRevision))
  }))
  app.post('/api/guilds/:guildId/modules/:moduleId/preview', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['config'])
    if (!req.body.config || !Object.hasOwn(req.body.config, 'channelId') || !Object.hasOwn(req.body.config, 'message')) throw new ConfigurationError('Vista previa inválida.', 'invalid_configuration')
    const config = validatePatch(req.body.config)
    const user = { username: 'Miembro de ejemplo', toString: () => '@Miembro de ejemplo' }
    res.json({ fixture: true, content: require('../handlers/welcome-message').renderWelcomeMessage(config.message, user, { name: 'Servidor de ejemplo', memberCount: 42 }) })
  }))
  app.post('/api/guilds/:guildId/modules/:moduleId/publish', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['draftRevision', 'expectedPublishedRevision', 'operationId'])
    const actor = await req.configurationGuild.members.fetch({ user: req.session.user.id, force: true })
    if (!actor.permissions.has('ManageGuild')) throw new ConfigurationError('No se verificó el permiso de configuración.', 'configuration_permissions')
    const current = await service().read(req.params.guildId, req.params.moduleId)
    if (current.draft && current.draft.revision === req.body.draftRevision) await assertWelcomeChannel(req.configurationGuild, req.session.user.id, current.draft.config.channelId)
    else if (current.lastPublication?.operationId !== req.body.operationId) throw new ConfigurationError('El borrador cambió.', 'configuration_conflict')
    res.json(await service().publish(req.params.guildId, req.params.moduleId, req.session.user.id, req.body.draftRevision, req.body.expectedPublishedRevision, req.body.operationId))
  }))
}
