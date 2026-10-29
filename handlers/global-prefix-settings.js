const { globalConfigurationFile } = require('./global-configuration')
const { createFileSettings } = require('./setup-file-settings')
const { prefixSchema } = require('./prefix-settings')
const { requireSetupAccess } = require('./setup-access')
const configFile = globalConfigurationFile('config.json')

function createGlobalPrefixSettings(client, context, { file = configFile } = {}) {
  return createFileSettings(client, {
    file,
    fields: { prefix: { default: '!', schema: prefixSchema } },
    async authorize(document) {
      const isOwner = /^\d{17,20}$/.test(context.actorId || '') &&
        Array.isArray(document.ownerIDS) && document.ownerIDS.includes(context.actorId)
      if (!isOwner) throw Object.assign(new Error('setup_denied'), { code: 'setup_denied' })
      // Keep the command's Administrator grant and recheck it after queue waits.
      try { await requireSetupAccess(client, context) }
      catch (error) {
        const code = ['setup_denied', 'setup_actor_permissions', 'setup_channel_access', 'setup_bot_permissions'].includes(error.message) ? 'setup_denied' : 'setup_unavailable'
        throw Object.assign(new Error(code), { code })
      }
    },
    publish(next) {
      // Every require(config.json) reader shares this object. Publish only after rename.
      if (file === configFile) require('../botconfig/config.json').prefix = next.prefix
      if (client.config) client.config.prefix = next.prefix
    },
  })
}

module.exports = { createGlobalPrefixSettings }
