const { z } = require('zod')
const { createSetupSettings } = require('./setup-settings')

const prefixSchema = z.string().min(1).max(5).refine(value => !/[\s\p{Cc}\p{Cf}]/u.test(value))

function createPrefixSettings(client) {
  return createSetupSettings(client.settings, {
    prefix: { path: 'prefix', default: client.config?.prefix || '!', schema: prefixSchema },
  }, () => Boolean(client._shuttingDown || client._dbReady === false))
}

module.exports = { prefixSchema, createPrefixSettings }
