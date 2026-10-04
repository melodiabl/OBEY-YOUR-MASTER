module.exports = client => {
  const { createArchitectService } = require('./architect/service')
  const { createDraftRepository } = require('./architect/repository')
  client.architect = createArchitectService({ repository: createDraftRepository(), storageReady: () => Boolean(client._dbReady && require('mongoose').connection.readyState === 1) })
  client.modules ||= require('./module-registry').createModuleRegistry()
  client.modules.register({
    id: 'architect', version: '1.0.0', defaults: { preserveExisting: true }, permissions: { read: 'ManageGuild', draft: 'ManageGuild' },
    commands: { slash: ['config.architect'], prefix: [] }, interactions: [], events: { consumed: [], emitted: [] }, jobs: ['architect.snapshot'],
    api: ['GET /api/architect/:guildId', 'POST /api/architect/:guildId/preview', 'POST /api/architect/:guildId/draft',
      'GET /api/architect/:guildId/jobs', 'POST /api/architect/:guildId/jobs', 'GET /api/architect/:guildId/jobs/:jobId', 'POST /api/architect/:guildId/jobs/:jobId/cancel'],
    realtime: { consumed: [], emitted: [] }, dependencies: ['mongoose', 'discord.js'],
    capabilities: { snapshot: 'available', preview: 'available', drafts: 'available', apply: 'unavailable', ai: 'unavailable', rollback: 'unavailable' },
  }, client.architect)
}
