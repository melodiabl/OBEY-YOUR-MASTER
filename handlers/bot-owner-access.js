const { globalConfigurationFile } = require('./global-configuration')
const { readOwnerIds } = require('./setup-owner-settings')
const { requireSetupAccess } = require('./setup-access')
const ownerFileDefault = globalConfigurationFile('config.json')
async function requireBotOwnerAccess(client, context, ownerFile = ownerFileDefault, { timeoutMs = 10000 } = {}) {
  const fail = code => { throw Object.assign(new Error(code), { code }) }
  let timer
  const verification = (async () => { try {
    await requireSetupAccess(client, { ...context, authorizeActor: async () => {
      if (!/^\d{17,20}$/.test(context.actorId || '') || !(await readOwnerIds(ownerFile)).includes(context.actorId)) fail('setup_denied')
    } })
  } catch (error) { fail(['setup_denied', 'setup_actor_permissions', 'setup_channel_access', 'setup_bot_permissions'].includes(error.message) ? 'setup_denied' : 'setup_unavailable') } })()
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('setup_unavailable'), { code: 'setup_unavailable' })), timeoutMs) })
  try { return await Promise.race([verification, deadline]) } finally { clearTimeout(timer) }
}
module.exports = { requireBotOwnerAccess }
