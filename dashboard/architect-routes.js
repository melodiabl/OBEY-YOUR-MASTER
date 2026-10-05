const { BlueprintError } = require('../handlers/architect/blueprint')
const { JobError } = require('../handlers/jobs/service')
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
      if (['revision_conflict', 'draft_conflict', 'job_conflict', 'application_conflict', 'application_expired', 'application_blocked'].includes(code)) return res.status(409).json({ error: code })
      if (code === 'application_not_found') return res.status(404).json({ error: code })
      if (code === 'application_unsupported') return res.status(400).json({ error: code })
      if (error instanceof JobError && code === 'invalid_job') return res.status(400).json({ error: code })
      if (error instanceof BlueprintError && ['invalid_blueprint', 'invalid_wizard', 'invalid_decoration', 'decoration_name_limit'].includes(code)) return res.status(400).json({ error: code, detail: error.message })
      return res.status(503).json({ error: ['storage_unavailable', 'jobs_unavailable', 'apply_unavailable'].includes(code) ? code : 'architect_unavailable' })
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
  app.post('/api/architect/:guildId/generate', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).some(key => !['blueprint', 'choices'].includes(key))) throw new BlueprintError('Invalid wizard request', 'invalid_wizard')
    res.json({ ok: true, ...(await service.generate(req.architectGuild, req.session.user.id, req.body.blueprint, req.body.choices)) })
  }))
  app.post('/api/architect/:guildId/decorate', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).some(key => !['blueprint', 'choices'].includes(key))) throw new BlueprintError('Invalid decoration request', 'invalid_decoration')
    res.json({ ok: true, ...(await service.decorate(req.architectGuild, req.session.user.id, req.body.blueprint, req.body.choices)) })
  }))
  app.post('/api/architect/:guildId/draft', ...guarded, wrap(async (req, res) => {
    res.json({ ok: true, ...(await service.save(req.architectGuild, req.session.user.id, req.body?.blueprint, req.body?.expectedRevision)) })
  }))
  app.post('/api/architect/:guildId/applications', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).some(key => key !== 'blueprint')) throw new JobError('Invalid application request')
    if (!client.architectApplications) throw new JobError('Application unavailable', 'apply_unavailable')
    res.json({ ok: true, plan: await client.architectApplications.prepare(req.architectGuild, req.session.user.id, req.body.blueprint) })
  }))
  app.post('/api/architect/:guildId/applications/confirm', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).some(key => !['id', 'confirmation', 'revision'].includes(key))) throw new JobError('Invalid application confirmation')
    if (!client.architectApplications) throw new JobError('Application unavailable', 'apply_unavailable')
    res.status(202).json({ ok: true, job: await client.architectApplications.confirm(req.architectGuild, req.session.user.id, req.body) })
  }))
  const jobs = () => {
    if (!client.jobs) throw new JobError('Jobs unavailable', 'jobs_unavailable')
    return client.jobs
  }
  const restorePoints = () => {
    if (!client.restorePoints) throw new JobError('Restore storage unavailable', 'storage_unavailable')
    return client.restorePoints
  }
  app.get('/api/architect/:guildId/restore-points', ...guarded, wrap(async (req, res) => {
    res.json({ ok: true, points: await restorePoints().list(req.architectGuild.id, req.session.user.id) })
  }))
  app.get('/api/architect/:guildId/restore-points/:pointId', ...guarded, wrap(async (req, res) => {
    const point = await restorePoints().get(req.params.pointId, req.architectGuild.id, req.session.user.id)
    if (!point) return res.status(404).json({ error: 'restore_point_not_found' })
    res.json({ ok: true, point })
  }))
  app.post('/api/architect/:guildId/restore-points', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).some(key => key !== 'idempotencyKey')) throw new JobError('Invalid restore point request')
    const job = await jobs().submit({ guildId: req.architectGuild.id, actorId: req.session.user.id,
      type: 'architect.backup', idempotencyKey: req.body.idempotencyKey })
    res.status(202).json({ ok: true, job })
  }))
  app.get('/api/architect/:guildId/jobs', ...guarded, wrap(async (req, res) => {
    const service = jobs()
    res.json({ ok: true, available: service.available(), jobs: await service.list(req.architectGuild.id, req.session.user.id) })
  }))
  app.post('/api/architect/:guildId/jobs', ...guarded, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).some(key => key !== 'idempotencyKey')) throw new JobError('Invalid job request')
    const job = await jobs().submit({ guildId: req.architectGuild.id, actorId: req.session.user.id,
      type: 'architect.snapshot', idempotencyKey: req.body.idempotencyKey })
    res.status(202).json({ ok: true, job })
  }))
  for (const action of ['get', 'cancel']) {
    const path = `/api/architect/:guildId/jobs/:jobId${action === 'cancel' ? '/cancel' : ''}`
    app[action === 'cancel' ? 'post' : 'get'](path, ...guarded, wrap(async (req, res) => {
      const job = await jobs()[action](req.params.jobId, req.architectGuild.id, req.session.user.id)
      if (!job) return res.status(404).json({ error: 'job_not_found' })
      res.json({ ok: true, job })
    }))
  }
}
