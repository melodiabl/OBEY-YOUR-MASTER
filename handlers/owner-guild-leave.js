const { requireBotOwnerAccess } = require('./bot-owner-access')
const { runSetupOperation } = require('./setup-operations')
const preparations = new WeakMap(), active = new WeakMap()
const fail = code => { throw Object.assign(new Error(code), { code }) }
const validId = id => typeof id === 'string' && /^\d{17,20}$/.test(id)
const sameContext = (a, b) => ['guildId', 'channelId', 'actorId'].every(key => a[key] === b[key])
function bounded(client, execute, timeoutMs) {
  let expired = false, admitted = false, timer
  const available = () => { if (client._shuttingDown) fail('setup_unavailable'); if (expired) fail('leave_timeout') }
  const operation = runSetupOperation(client, () => execute(available, () => { admitted = true }))
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => {
    expired = true
    reject(Object.assign(new Error('leave_timeout'), { code: admitted ? 'leave_unconfirmed' : 'leave_timeout' }))
  }, timeoutMs) })
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer))
}
async function currentTarget(client, guildId) {
  if (!client.guilds.cache.has(guildId) || client.guilds.cache.get(guildId).available === false) fail('leave_target')
  let guild, bot
  try {
    guild = await client.guilds.fetch({ guild: guildId, force: true })
    if (guild?.id !== guildId || guild.available === false || !client.guilds.cache.has(guildId)) fail('leave_target')
    bot = await guild.members.fetchMe({ force: true })
  } catch { fail('leave_target') }
  if (bot?.id !== client.user.id || bot.guild?.id !== guildId || !client.guilds.cache.has(guildId)) fail('leave_target')
  return guild
}
function prepareGuildLeave(client, context, guildId, { ownerFile, timeoutMs = 10000 } = {}) {
  return bounded(client, async available => {
    if (!validId(guildId)) fail('leave_invalid')
    await requireBotOwnerAccess(client, context, ownerFile)
    available()
    const guild = await currentTarget(client, guildId)
    available()
    await requireBotOwnerAccess(client, context, ownerFile)
    available()
    const prepared = Object.freeze({ guildId, name: String(guild.name).slice(0, 100), expiresAt: Date.now() + 30000 })
    preparations.set(prepared, { client, context: { ...context }, botId: client.user.id })
    return prepared
  }, timeoutMs)
}
function confirmGuildLeave(client, context, prepared, { ownerFile, timeoutMs = 20000, beforeLeave } = {}) {
  const entry = prepared && preparations.get(prepared)
  if (!entry || entry.client !== client || !sameContext(entry.context, context)) return Promise.reject(Object.assign(new Error('leave_invalid'), { code: 'leave_invalid' }))
  preparations.delete(prepared)
  return bounded(client, async (available, admit) => {
    const check = () => {
      available()
      if (client.user.id !== entry.botId || !client.guilds.cache.has(prepared.guildId) || client.guilds.cache.get(prepared.guildId).available === false) fail('leave_target')
      if (Date.now() >= prepared.expiresAt) fail('leave_expired')
    }
    check()
    await requireBotOwnerAccess(client, context, ownerFile)
    check()
    let pending = active.get(client)
    if (!pending) { pending = new Set(); active.set(client, pending) }
    if (pending.has(prepared.guildId)) fail('leave_busy')
    pending.add(prepared.guildId)
    try {
      const guild = await currentTarget(client, prepared.guildId)
      check()
      if (String(guild.name).slice(0, 100) !== prepared.name) fail('leave_conflict')
      await requireBotOwnerAccess(client, context, ownerFile)
      check()
      if (typeof beforeLeave !== 'function') fail('leave_delivery')
      try { await beforeLeave() } catch { fail('leave_delivery') }
      check()
      await requireBotOwnerAccess(client, context, ownerFile)
      check()
      let result
      try { admit(); result = await guild.leave() } catch { fail('leave_unconfirmed') }
      if (result?.id !== prepared.guildId) fail('leave_unconfirmed')
      return { guildId: prepared.guildId }
    } finally { pending.delete(prepared.guildId) }
  }, timeoutMs)
}
module.exports = { prepareGuildLeave, confirmGuildLeave }
