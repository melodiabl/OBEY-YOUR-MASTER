const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.helpService
  client.helpService = require('./help').helpService(client)
  client.modules ||= require('./feature-registry').createModuleRegistry()
  client.modules.register({
    id: 'utilities', version: '1.0.0', defaults: { helpVisibility: 'available', ephemeralDefault: true },
    permissions: { read: 'current-guild-member', configure: 'ManageGuild' },
    commands: { prefix: ['help'], slash: ['info.help'] }, interactions: ['hm_select', 'hm_home', 'hm_prev', 'hm_next', 'hm_categories_prev', 'hm_categories_next'],
    events: { consumed: ['interactionCreate', 'messageCreate'], emitted: [] }, jobs: [],
    api: ['GET /api/help/:guildId'], realtime: { emitted: [], consumed: [] }, dependencies: ['discord.js'],
    capabilities: { contextualHelp: 'available', guildPreferences: 'pending', commandToggles: 'pending' },
  }, client.helpService)
  initialized.add(client)
  return client.helpService
}
