const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createGuildLock } = require('../handlers/jobs/guild-lock')
function redisFixture() {
  const values = new Map()
  return {
    values,
    async set(key, token) { if (values.has(key)) return null; values.set(key, token); return 'OK' },
    async eval(script, count, key, token) {
      if (values.get(key) !== token) return 0
      if (script.includes("'DEL'")) values.delete(key)
      return 1
    },
  }
}
test('a guild lease excludes concurrent work but allows another guild and releases after errors', async () => {
  const redis = redisFixture(), locks = createGuildLock({ client: () => redis })
  await locks.run('g', async lease => {
    await lease.assertOwned()
    await assert.rejects(locks.run('g', assert.fail), error => error.code === 'guild_locked')
    assert.equal(await locks.run('other', () => 'parallel'), 'parallel')
  })
  await assert.rejects(locks.run('g', () => { throw new Error('fixture failure') }), /fixture failure/)
  assert.equal(await locks.run('g', () => 'free'), 'free')
  assert.equal(redis.values.size, 0)
})
test('an old worker cannot renew or remove a replacement lease or continue after Redis loss', async () => {
  const redis = redisFixture(), locks = createGuildLock({ client: () => redis })
  await assert.rejects(locks.run('g', async lease => {
    redis.values.set('obey:guild-lock:g', 'replacement')
    await lease.assertOwned()
  }), error => error.code === 'guild_lock_lost')
  assert.equal(redis.values.get('obey:guild-lock:g'), 'replacement')
  redis.values.clear()
  await assert.rejects(locks.run('g', async lease => {
    redis.eval = async () => { throw new Error('private connection') }
    await lease.assertOwned()
  }), error => error.code === 'guild_lock_lost')
})
