const STORE_KEY = 'MUTES'
const memberLocks = new Map()

async function withMemberMute(guildId, userId, operation) {
  const key = guildId + ':' + userId
  const previous = memberLocks.get(key) || Promise.resolve()
  let release
  const waiting = new Promise(resolve => { release = resolve })
  const current = previous.then(() => waiting)
  memberLocks.set(key, current)
  await previous
  try { return await operation() }
  finally {
    release()
    if (memberLocks.get(key) === current) memberLocks.delete(key)
  }
}

function entries(client) {
  const value = client.mutes.get(STORE_KEY, STORE_KEY)
  return Array.isArray(value) ? value : []
}

function sameEntry(a, b) {
  return Boolean(a && b && a.guild === b.guild && a.user === b.user && a.role === b.role && a.timestamp === b.timestamp)
}

async function change(client, transform) {
  return client.mutes.exclusive(async () => {
    const before = entries(client)
    const after = transform(before)
    if (after === before) return false
    await client.mutes.model.findOneAndUpdate(
      { guildId: STORE_KEY },
      { $set: { MUTES: after } },
      { upsert: true, runValidators: true }
    )
    client.mutes.patchCached(STORE_KEY, { MUTES: after })
    return true
  })
}

async function saveRoleMute(client, entry) {
  if (!entry || !entry.guild || !entry.user || !entry.role ||
      !Number.isSafeInteger(entry.timestamp) ||
      !Number.isSafeInteger(entry.mutetime) || entry.mutetime < -1 || entry.mutetime === 0) {
    throw new TypeError('Invalid role mute')
  }
  return change(client, before => [
    ...before.filter(item => !item || !(item.guild === entry.guild && item.user === entry.user)),
    entry,
  ])
}

async function removeRoleMute(client, entry) {
  return change(client, before => {
    const after = before.filter(item => !sameEntry(item, entry))
    return after.length === before.length ? before : after
  })
}

async function removeMemberMutes(client, guildId, userId) {
  return change(client, before => {
    const after = before.filter(item => !item || !(item.guild === guildId && item.user === userId))
    return after.length === before.length ? before : after
  })
}

module.exports = { entries, saveRoleMute, removeRoleMute, removeMemberMutes, sameEntry, withMemberMute }
