const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.moduleConfiguration
  const service = require('./module-configuration').createModuleConfiguration(client.settings)
  client.modules ||= require('./module-registry').createModuleRegistry()
  client.modules.register({
    id: 'welcome', version: '1.0.0', defaults: { channelId: null, message: '' },
    permissions: { read: 'ManageGuild', configure: 'ManageGuild' },
    commands: { slash: ['welcome.canal', 'welcome.mensaje'], prefix: ['setup-welcome'] },
    interactions: [], events: { consumed: ['guildMemberAdd'], emitted: [] }, jobs: [],
    api: ['GET /api/guilds/:guildId/modules/welcome/config', 'PUT /api/guilds/:guildId/modules/welcome/draft', 'POST /api/guilds/:guildId/modules/welcome/publish'],
    realtime: { consumed: [], emitted: [] }, dependencies: ['mongoose'],
    configuration: { schemaVersion: 1, fields: ['channelId', 'message'] },
    capabilities: { channelMessageConfiguration: 'available', draftPublication: 'available', deliveryDeduplication: 'pending', cards: 'pending' },
  }, service)
  client.moduleConfiguration = service
  initialized.add(client)
  return service
}
