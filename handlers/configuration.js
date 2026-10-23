const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.welcomeConfiguration
  const service = require('./configuration-service').createModuleConfiguration(client.settings)
  const { welcomeConfiguration } = require('./welcome-configuration')
  const { ConfigurationError, createWelcomeService, configJsonSchema } = require('./welcome/index.js')
  const { assertWelcomeActor, assertWelcomeChannel } = require('./welcome-access')
  function guildFor({ guildId }) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild || guild.available === false) throw new ConfigurationError('Bienvenida no disponible.', 'configuration_not_found')
    return guild
  }
  client.welcomeConfiguration = createWelcomeService({
    drafts: service, published: welcomeConfiguration(client.settings),
    isStopping: () => Boolean(client._shuttingDown),
    policy: {
      authorize: async context => { await assertWelcomeActor(guildFor(context), context.actorId) },
      channel: async (context, channelId) => { await assertWelcomeChannel(guildFor(context), context.actorId, channelId) },
      channels: async context => {
        const guild = guildFor(context)
        const [channels, actor] = await Promise.all([guild.channels.fetch(), assertWelcomeActor(guild, context.actorId)])
        return [...channels.values()].filter(channel => channel.type === 0 && channel.permissionsFor(actor)?.has('ViewChannel')).map(({ id, name }) => ({ id, name }))
      },
    },
  })
  client.stopWelcomeConfiguration = client.welcomeConfiguration.drain
  client.modules ||= require('./feature-registry').createModuleRegistry()
  client.modules.register({
    id: 'welcome', version: '1.0.0', defaults: { channelId: null, message: '' },
    permissions: { read: 'ManageGuild', configure: 'ManageGuild' },
    commands: { slash: ['welcome.canal', 'welcome.mensaje'], prefix: ['setup-welcome'] },
    interactions: [], events: { consumed: ['guildMemberAdd'], emitted: [] }, jobs: [],
    api: [
      "GET /api/config/:guildId/welcome",
      "POST /api/config/:guildId/welcome",
      "GET /api/guilds/:guildId/modules/welcome/editor",
      "GET /configuration/:guildId/welcome",
      "GET /api/guilds/:guildId/modules/welcome/config",
      "GET /api/guilds/:guildId/modules/welcome/channels",
      "PUT /api/guilds/:guildId/modules/welcome/draft",
      "POST /api/guilds/:guildId/modules/welcome/preview",
      "POST /api/guilds/:guildId/modules/welcome/publish",
    ],
    realtime: { consumed: [], emitted: [] }, dependencies: ['mongoose'],
    configuration: { schemaVersion: 1, fields: ['channelId', 'message'], schema: configJsonSchema },
    capabilities: { channelMessageConfiguration: 'available', draftPublication: 'available', deliveryDeduplication: 'pending', cards: 'pending' },
  }, client.welcomeConfiguration)
  initialized.add(client)
  return client.welcomeConfiguration
}
