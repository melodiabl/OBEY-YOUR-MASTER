const { createHash } = require('node:crypto')
const { PermissionFlagsBits: F } = require('discord.js')
const { requireSetupAccess } = require('./setup-access')
const preparations = new WeakMap(), active = new WeakMap()
const fail = code => { throw Object.assign(new Error(code), { code }) }
const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const sameContext = (a, b) => ['guildId', 'channelId', 'actorId'].every(key => a[key] === b[key])

function bounded(client, execute, timeoutMs) {
  let expired = false, admitted = false, timer
  const check = () => {
    if (client._shuttingDown || client._dbReady === false) fail('restore_unavailable')
    if (expired) fail('restore_timeout')
  }
  const operation = Promise.resolve().then(() => execute(check, () => { admitted = true }, () => expired))
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => {
    expired = true
    reject(Object.assign(new Error(admitted ? 'restore_unconfirmed' : 'restore_timeout'), { code: admitted ? 'restore_unconfirmed' : 'restore_timeout' }))
  }, timeoutMs) })
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer))
}

async function currentAccess(client, context, sourceId) {
  try {
    for (const id of new Set([context.guildId, sourceId])) {
      if (!client.guilds.cache.has(id)) fail('restore_denied')
      const guild = await client.guilds.fetch({ guild: id, force: true })
      const [member, bot] = await Promise.all([
        guild.members.fetch({ user: context.actorId, force: true }), guild.members.fetchMe({ force: true })
      ])
      if (guild.id !== id || guild.available === false || guild.ownerId !== context.actorId ||
        member?.id !== context.actorId || member.guild?.id !== id || bot?.id !== client.user.id ||
        bot.guild?.id !== id || !bot.permissions.has(F.Administrator)) fail('restore_denied')
    }
    const access = await requireSetupAccess(client, { ...context, authorizeActor: ({ guild, bot }) => {
      if (guild.ownerId !== context.actorId || !bot.permissions.has(F.Administrator)) fail('restore_denied')
    } })
    return access.guild
  } catch { fail('restore_denied') }
}

async function selectedBackup(client, sourceId, slot) {
  if (!client.backupDB?.model || typeof client.backupDB.flush !== 'function') fail('restore_unavailable')
  await client.backupDB.flush()
  const document = await client.backupDB.model.findOne({ guildId: sourceId }).lean().exec()
  let backup = document?.backups?.[slot - 1]
  if (Array.isArray(backup) && backup.length === 1) backup = backup[0]
  if (!backup || typeof backup !== 'object' || !validId(backup.id) || backup.guildID !== sourceId ||
    !Number.isSafeInteger(backup.createdTimestamp) || !Array.isArray(backup.roles) ||
    !Array.isArray(backup.channels?.categories) || !Array.isArray(backup.channels?.others) ||
    !Array.isArray(backup.bans) || !Array.isArray(backup.emojis)) fail('restore_invalid_backup')
  const raw = JSON.stringify(backup)
  if (Buffer.byteLength(raw) > 10 * 1024 * 1024) fail('restore_invalid_backup')
  return JSON.parse(raw)
}

function prepareRestore(client, context, sourceId, slot, { timeoutMs = 15000 } = {}) {
  return bounded(client, async check => {
    if (![context.guildId, context.actorId, context.channelId, sourceId].every(validId) || !/^[1-5]$/.test(slot)) fail('restore_invalid')
    check()
    const target = await currentAccess(client, context, sourceId)
    check()
    const backup = await selectedBackup(client, sourceId, Number(slot))
    check()
    await currentAccess(client, context, sourceId)
    check()
    const prepared = Object.freeze({ sourceId, targetId: context.guildId, targetName: String(target.name).slice(0, 100),
      slot: Number(slot), backupId: backup.id, createdTimestamp: backup.createdTimestamp, expiresAt: Date.now() + 90000 })
    preparations.set(prepared, { client, context: { ...context }, botId: client.user.id, hash: fingerprint(backup) })
    return prepared
  }, timeoutMs)
}

function confirmRestore(client, context, prepared, { timeoutMs = 120000, beforeLoad, load = require('discord-backup').load } = {}) {
  const entry = prepared && preparations.get(prepared)
  if (!entry || entry.client !== client || !sameContext(entry.context, context)) return Promise.reject(Object.assign(new Error('restore_invalid'), { code: 'restore_invalid' }))
  preparations.delete(prepared)
  let pending = active.get(client)
  if (!pending) { pending = new Set(); active.set(client, pending) }
  if (pending.has(prepared.targetId)) return Promise.reject(Object.assign(new Error('restore_busy'), { code: 'restore_busy' }))
  pending.add(prepared.targetId)
  return bounded(client, async (available, admit, expired) => {
    let admitted = false, confirmed = false
    const check = () => {
      available()
      if (Date.now() >= prepared.expiresAt) fail('restore_expired')
      if (client.user.id !== entry.botId) fail('restore_denied')
    }
    try {
      check()
      await currentAccess(client, context, prepared.sourceId)
      check()
      let backup = await selectedBackup(client, prepared.sourceId, prepared.slot)
      check()
      if (fingerprint(backup) !== entry.hash) fail('restore_conflict')
      if (typeof beforeLoad !== 'function') fail('restore_delivery')
      try { await beforeLoad() } catch { fail('restore_delivery') }
      check()
      backup = await selectedBackup(client, prepared.sourceId, prepared.slot)
      check()
      if (fingerprint(backup) !== entry.hash) fail('restore_conflict')
      const target = await currentAccess(client, context, prepared.sourceId)
      check()
      let result
      try { admitted = true; admit(); result = await load(backup, target, { clearGuildBeforeRestore: true }) }
      catch { fail('restore_unconfirmed') }
      if (result?.id !== prepared.backupId || expired()) fail('restore_unconfirmed')
      confirmed = true
      return { backupId: prepared.backupId, targetId: prepared.targetId, status: 'library_returned' }
    } finally {
      // A failure after admission can leave a partly cleared guild. Keep it
      // reserved for recovery, never automatically repeat a destructive load.
      if (!admitted || confirmed) pending.delete(prepared.targetId)
    }
  }, timeoutMs)
}
module.exports = { prepareRestore, confirmRestore }
