const { randomUUID } = require('node:crypto')
const { identifier } = require('./service')
const RENEW = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) else return 0 end"
const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end"
class GuildLockError extends Error {
  constructor(code) { super(code); this.code = code }
}
function createGuildLock({ client, prefix = 'obey:guild-lock', ttl = 30000 }) {
  if (!Number.isInteger(ttl) || ttl < 300 || ttl > 300000) throw new Error('Invalid guild lease duration')
  return {
    async run(guildId, action) {
      identifier(guildId, 'guild')
      const connection = client(), key = `${prefix}:${guildId}`, token = randomUUID()
      if (!connection || await connection.set(key, token, 'PX', ttl, 'NX') !== 'OK') throw new GuildLockError('guild_locked')
      let lost = false, renewing
      async function assertOwned() {
        if (lost) throw new GuildLockError('guild_lock_lost')
        if (!renewing) renewing = (async () => {
          try { if (await connection.eval(RENEW, 1, key, token, String(ttl)) !== 1) lost = true }
          catch { lost = true }
        })()
        await renewing; renewing = null
        if (lost) throw new GuildLockError('guild_lock_lost')
      }
      const timer = setInterval(() => { assertOwned().catch(() => {}) }, Math.floor(ttl / 3)); timer.unref()
      try { return await action({ assertOwned }) }
      finally {
        clearInterval(timer); await renewing
        await connection.eval(RELEASE, 1, key, token).catch(() => {})
      }
    },
  }
}
module.exports = { createGuildLock, GuildLockError }
