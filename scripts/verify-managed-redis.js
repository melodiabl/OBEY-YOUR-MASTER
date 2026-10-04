// Checks only the dedicated, explicitly configured OBEY Redis. No bot or Mongo connection.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const { Queue } = require('bullmq')
const { connectionOptions } = require('../handlers/jobs/runtime')
async function main() {
  const values = require('dotenv').parse(fs.readFileSync(path.resolve(__dirname, '../.env.jobs')))
  const url = new URL(values.OBEY_JOBS_REDIS_URL)
  assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '6380'); assert.equal(url.pathname, '/0')
  assert.ok(url.password)
  const queue = new Queue(`obey-redis-check-${randomUUID()}`, { connection: { ...connectionOptions(url.href), maxRetriesPerRequest: 1 } })
  queue.on('error', () => {})
  const key = `obey:redis-check:${randomUUID()}`, value = randomUUID()
  let client
  try {
    client = await queue.waitUntilReady()
    assert.equal(await client.ping(), 'PONG')
    assert.equal((await client.config('GET', 'appendonly'))[1], 'yes')
    assert.equal((await client.config('GET', 'maxmemory-policy'))[1], 'noeviction')
    await client.set(key, value, 'EX', 300)
    let restarted = false
    if (process.argv.includes('--restart-owned')) {
      const owned = JSON.parse(execFileSync('podman', ['inspect', 'obey_redis'], { encoding: 'utf8' }))[0]
      assert.equal(owned.Config.Labels['io.podman.compose.project'], 'obey-infrastructure')
      execFileSync('podman', ['restart', '--time', '30', 'obey_redis'], { stdio: 'ignore' })
      for (let attempt = 0; attempt < 100; attempt++) {
        try { if (client.status === 'ready' && await client.get(key) === value) { restarted = true; break } } catch {}
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.equal(restarted, true)
    }
    const unauthenticated = execFileSync('podman', ['exec', 'obey_redis', 'redis-cli', '-h', '127.0.0.1', '-p', '6380', 'ping'], { encoding: 'utf8' })
    assert.match(unauthenticated, /NOAUTH/)
    return { endpoint: '127.0.0.1:6380/0', authenticated: true, unauthenticatedDenied: true,
      aof: true, noEviction: true, persistedAcrossRestart: restarted, bullmqConnected: true }
  } finally {
    if (client?.status === 'ready') await client.del(key)
    await queue.obliterate({ force: true }).catch(() => {})
    await queue.close()
  }
}
main().then(result => console.log(JSON.stringify(result))).catch(() => { console.error('Dedicated Redis verification failed.'); process.exitCode = 1 })
