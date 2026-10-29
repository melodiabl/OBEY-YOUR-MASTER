const { createFileSettings } = require('./setup-file-settings')
const { globalConfigurationFile } = require('./global-configuration')
const { statusSchema, statusPatchSchema } = require('./bot-status-contract')
const { readOwnerIds } = require('./setup-owner-settings')
const { requireSetupAccess } = require('./setup-access')
const { botStatusRuntime } = require('./bot-status-runtime')
const statusFile = globalConfigurationFile('status.json'), configFile = globalConfigurationFile('config.json')
const fail = code => { throw Object.assign(new Error(code), { code }) }
function createBotStatusSettings(client, context, { file = statusFile, ownerFile = configFile } = {}) {
  const repository = createFileSettings(client, { file,
    fields: { status: { default: statusSchema.parse((client.config || require('../botconfig/config.json')).status), schema: statusSchema } },
    async authorize() {
      const authorizeActor = async () => { if (!/^\d{17,20}$/.test(context.actorId || '') || !(await readOwnerIds(ownerFile)).includes(context.actorId)) fail('setup_denied') }
      try { await requireSetupAccess(client, { ...context, authorizeActor }) }
      catch (error) { fail(['setup_denied', 'setup_actor_permissions', 'setup_channel_access', 'setup_bot_permissions'].includes(error.message) ? 'setup_denied' : 'setup_unavailable') }
    },
    publish(next) {
      const status = structuredClone(next.status)
      if (file === statusFile) require('../botconfig/config.json').status = status
      if (client.config) client.config.status = status
      botStatusRuntime(client).apply()
    },
  })
  const project = value => ({ values: statusSchema.parse(value.values.status), revision: value.revision })
  return { async read() { return project(await repository.read()) },
    async save(_key, input, revision) {
      const patch = statusPatchSchema.safeParse(input)
      if (!patch.success) fail('invalid_setup')
      const before = await repository.read()
      if (before.revision !== revision) fail('setup_conflict')
      const next = statusSchema.safeParse({ ...before.values.status, ...patch.data })
      if (!next.success) fail('invalid_setup')
      return project(await repository.save(null, { status: next.data }, revision))
    },
  }
}
module.exports = { createBotStatusSettings }
