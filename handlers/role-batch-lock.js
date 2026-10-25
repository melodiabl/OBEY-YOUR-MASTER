const activeGuilds = new WeakMap()

// Synchronous admission covers roster loading and every bulk-role command in this process.
// Persistent recovery and coordination across processes belong to the jobs migration.
function acquireRoleBatch(client, guildId) {
  if (client._shuttingDown) throw new Error('The bot is restarting. This role operation has stopped; check the existing roles before retrying.')
  let active = activeGuilds.get(client)
  if (!active) activeGuilds.set(client, active = new Set())
  if (active.has(guildId)) return null
  active.add(guildId)
  let released = false
  return () => {
    if (released) return
    released = true
    active.delete(guildId)
  }
}

module.exports = { acquireRoleBatch }
