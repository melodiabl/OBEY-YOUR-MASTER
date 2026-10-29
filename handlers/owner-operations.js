const { requireBotOwnerAccess } = require('./bot-owner-access')
const { version: discordVersion } = require('discord.js')
const { version } = require('../package.json')
const fail = () => { throw Object.assign(new Error('owner_info_unavailable'), { code: 'owner_info_unavailable' }) }
async function readBotIdentity(client, context, { ownerFile, timeoutMs = 10000 } = {}) {
  let expired = false, timer
  const operation = (async () => {
    await requireBotOwnerAccess(client, context, ownerFile)
    if (expired) fail()
    let application = null
    try {
      const data = await client.application?.fetch()
      if (data?.id === client.user.id && typeof data.name === 'string') application = { id: data.id, name: data.name.slice(0, 100).toWellFormed(), botPublic: typeof data.botPublic === 'boolean' ? data.botPublic : null }
    } catch { /* Identity is still available; application metadata is explicitly unavailable. */ }
    if (expired) fail()
    await requireBotOwnerAccess(client, context, ownerFile)
    if (expired) fail()
    return { botId: client.user.id, botName: String(client.user.username || 'OBEY').slice(0, 100).toWellFormed(), application,
      version, node: process.version, discord: discordVersion }
  })()
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => { expired = true; reject(Object.assign(new Error('owner_info_unavailable'), { code: 'owner_info_unavailable' })) }, timeoutMs) })
  try { return await Promise.race([operation, deadline]) } finally { clearTimeout(timer) }
}
module.exports = { readBotIdentity }
