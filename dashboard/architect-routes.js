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
      if (['revision_conflict', 'draft_conflict', 'job_conflict'].includes(code)) return res.status(409).json({ error: code })
      if (error instanceof JobError && code === 'invalid_job') return res.status(400).json({ error: code })
      if (error instanceof BlueprintError && code === 'invalid_blueprint') return res.status(400).json({ error: code, detail: error.message })
      return res.status(503).json({ error: ['storage_unavailable', 'jobs_unavailable'].includes(code) ? code : 'architect_unavailable' })
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
  const jobs = () => {
    if (!client.jobs) throw new JobError('Jobs unavailable', 'jobs_unavailable')
    return client.jobs
  }
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
