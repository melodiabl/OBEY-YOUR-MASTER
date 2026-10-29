const { z } = require('zod')
const { createSetupSettings, SetupSettingsError } = require('./setup-settings')
const { requireSetupAccess } = require('./setup-access')
const { prefixSchema } = require('./prefix-settings')
const config = require('../botconfig/config.json')

const referenceFields = ['textchannel', 'voicechannel', 'category', 'message_cmd_info', 'message_queue_info', 'message_track_info']
function fail(code) { throw new SetupSettingsError(code) }
async function requireResetAccess(client, context) {
  if (client._shuttingDown || client._dbReady === false) fail('setup_unavailable')
  try {
    const guild = await client.guilds.fetch({ guild: context.guildId, force: true })
    if (guild?.id !== context.guildId || guild.available === false) fail('setup_denied')
    if (guild.ownerId !== context.actorId) fail('reset_owner_required')
    await requireSetupAccess(client, context)
  } catch (error) {
    if (error instanceof SetupSettingsError) throw error
    const code = error.code || error.message
    fail(['setup_unavailable', 'setup_denied', 'setup_actor_permissions', 'setup_channel_access', 'setup_bot_permissions'].includes(code) ? code : 'setup_unavailable')
  }
}
function resetSettings(client, context, prefix) {
  const store = client.settings
  // The current loader aliases both names to Guild; never split this reset across stores.
  if (!store || client.setups !== store) fail('setup_unavailable')
  const fields = {
    prefix: { path: 'prefix', default: prefix, schema: prefixSchema },
    djroles: { path: 'djroles', default: [], schema: z.array(z.string()) },
    botchannel: { path: 'botchannel', default: [], schema: z.array(z.string()) },
    ...Object.fromEntries(referenceFields.map(path => [path, { path, default: '0', schema: z.literal('0') }])),
  }
  const repository = { model: store.model, guildKey: store.guildKey, get: store.get.bind(store), patchCached: store.patchCached.bind(store),
    exclusive: operation => store.exclusive(async () => {
      // Reauthorize after waiting for earlier accepted writes, immediately before the operation.
      await requireResetAccess(client, context)
      return operation()
    }) }
  return createSetupSettings(repository, fields, () => Boolean(client._shuttingDown || client._dbReady === false))
}
async function prepareLegacyReset(client, context) {
  const prefix = client.config?.prefix || config.prefix
  if (!prefixSchema.safeParse(prefix).success) fail('invalid_setup')
  const snapshot = await resetSettings(client, context, prefix).read(context.guildId)
  await requireResetAccess(client, context)
  return { revision: snapshot.revision, prefix }
}
async function confirmLegacyReset(client, context, prepared) {
  if (!z.strictObject({ revision: z.string().regex(/^[a-f0-9]{64}$/), prefix: prefixSchema }).safeParse(prepared).success) fail('invalid_setup')
  const values = { prefix: prepared.prefix, djroles: [], botchannel: [], ...Object.fromEntries(referenceFields.map(path => [path, '0'])) }
  return resetSettings(client, context, prepared.prefix).save(context.guildId, values, prepared.revision)
}
module.exports = { prepareLegacyReset, confirmLegacyReset }
