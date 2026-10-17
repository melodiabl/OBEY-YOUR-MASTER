const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.welcomeConfiguration
  const service = require('./configuration-service').createModuleConfiguration(client.settings)
  const { ConfigurationError, welcomeConfiguration } = require('./welcome-configuration')
  const { assertWelcomeActor, assertWelcomeChannel } = require('./welcome-access')
  function guildFor({ guildId }) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild || guild.available === false || client._shuttingDown) throw new ConfigurationError('Bienvenida no disponible.', 'configuration_not_found')
    return guild
  }
  client.welcomeConfiguration = require('./welcome/service').createWelcomeService({
    drafts: service, published: welcomeConfiguration(client.settings),
    policy: {
      authorize: async context => { await assertWelcomeActor(guildFor(context), context.actorId) },
      channel: async (context, channelId) => { await assertWelcomeChannel(guildFor(context), context.actorId, channelId) },
    },
  })
  client.modules ||= require('./feature-registry').createModuleRegistry()
  client.modules.register({
    id: 'welcome', version: '1.0.0', defaults: { channelId: null, message: '' },
    permissions: { read: 'ManageGuild', configure: 'ManageGuild' },
    commands: { slash: ['welcome.canal', 'welcome.mensaje'], prefix: ['setup-welcome'] },
    interactions: [], events: { consumed: ['guildMemberAdd'], emitted: [] }, jobs: [],
    api: ['GET /api/guilds/:guildId/modules/welcome/config', 'PUT /api/guilds/:guildId/modules/welcome/draft', 'POST /api/guilds/:guildId/modules/welcome/publish'],
    realtime: { consumed: [], emitted: [] }, dependencies: ['mongoose'],
    configuration: { schemaVersion: 1, fields: ['channelId', 'message'], schema: require('./welcome/contract').configJsonSchema },
    capabilities: { channelMessageConfiguration: 'available', draftPublication: 'available', deliveryDeduplication: 'pending', cards: 'pending' },
  }, client.welcomeConfiguration)
  initialized.add(client)
  return client.welcomeConfiguration
}
