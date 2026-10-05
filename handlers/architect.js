module.exports = client => {
  const storageReady = () => Boolean(client._dbReady && require('mongoose').connection.readyState === 1)
  const applyAvailable = guild => (process.env.OBEY_ARCHITECT_APPLY_GUILDS || '').split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id)).includes(guild.id)
  client.restorePoints = require('./architect/restore-points').createRestorePointService({
    repository: require('./architect/restore-point-repository').createRestorePointRepository(),
    storageReady,
  })
  const { createArchitectService } = require('./architect/service')
  const { createDraftRepository } = require('./architect/repository')
  client.architect = createArchitectService({ repository: createDraftRepository(), storageReady, applyAvailable })
  client.architectApplications = require('./architect/application').createApplicationService({
    repository: require('./architect/application-repository').createApplicationRepository(), storageReady,
    preview: (...args) => client.architect.preview(...args), jobs: () => client.jobs, enabled: applyAvailable,
  })
  client.architectEdits = require('../workers/architect-edits').createEditExecutor({
    repository: client.jobRepository, restorePoints: client.restorePoints,
    guildOperations: require('./architect/application-repository').createGuildOperationRepository(), enabled: applyAvailable,
  })
  client.modules ||= require('./module-registry').createModuleRegistry()
  client.modules.register({
    id: 'architect', version: '1.0.0', defaults: { preserveExisting: true }, permissions: { read: 'ManageGuild', draft: 'ManageGuild' },
    commands: { slash: ['config.architect'], prefix: [] }, interactions: [], events: { consumed: [], emitted: [] }, jobs: ['architect.snapshot', 'architect.backup', 'architect.apply'],
    api: ['GET /api/architect/:guildId', 'POST /api/architect/:guildId/generate', 'POST /api/architect/:guildId/preview', 'POST /api/architect/:guildId/draft',
      'GET /api/architect/:guildId/jobs', 'POST /api/architect/:guildId/jobs', 'GET /api/architect/:guildId/jobs/:jobId', 'POST /api/architect/:guildId/jobs/:jobId/cancel',
      'GET /api/architect/:guildId/restore-points', 'GET /api/architect/:guildId/restore-points/:pointId', 'POST /api/architect/:guildId/restore-points',
      'POST /api/architect/:guildId/applications', 'POST /api/architect/:guildId/applications/confirm'],
    realtime: { consumed: [], emitted: [] }, dependencies: ['mongoose', 'discord.js'],
    capabilities: { snapshot: 'available', wizard: 'partial', preview: 'available', drafts: 'available', restorePoints: 'available', apply: 'partial', applyFields: ['name', 'topic', 'color'], ai: 'unavailable', rollback: 'unavailable' },
  }, client.architect)
}
