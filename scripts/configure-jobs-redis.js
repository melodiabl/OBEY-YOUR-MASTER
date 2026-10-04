#!/usr/bin/env node
// Writes only OBEY's dedicated Redis configuration; never reads production .env.
const fs = require('node:fs')
const path = require('node:path')
const { randomBytes } = require('node:crypto')
function configure(root) {
  const directory = path.join(root, '.runtime/redis'), config = path.join(directory, 'redis.conf')
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  fs.chmodSync(path.join(root, '.runtime'), 0o700)
  fs.chmodSync(directory, 0o700)
  let password
  if (fs.existsSync(config)) {
    password = fs.readFileSync(config, 'utf8').match(/^requirepass ([a-f0-9]{64})$/m)?.[1]
    if (!password) throw new Error('Existing Redis configuration requires operator review; no files changed.')
  } else password = randomBytes(32).toString('hex')
  fs.writeFileSync(config, [
    'bind 127.0.0.1', 'protected-mode yes', 'port 6380', 'dir /data',
    'appendonly yes', 'appendfsync everysec', 'save ""',
    'maxmemory 256mb', 'maxmemory-policy noeviction', `requirepass ${password}`, '',
  ].join('\n'), { mode: 0o644 })
  // The containing directories are private; the mounted file must be readable by Redis's unprivileged UID.
  fs.chmodSync(config, 0o644)
  const env = path.join(root, '.env.jobs')
  fs.writeFileSync(env, `# Generated dedicated Redis credentials. Do not commit.\nOBEY_JOBS_ENABLED=true\nOBEY_JOBS_REDIS_URL=redis://:${password}@127.0.0.1:6380/0\n`, { mode: 0o600 })
  fs.chmodSync(env, 0o600)
  return { host: '127.0.0.1', port: 6380, database: 0, aof: true, eviction: 'noeviction' }
}
if (require.main === module) {
  try { console.log(JSON.stringify(configure(path.resolve(__dirname, '..')))) }
  catch { console.error('Redis configuration could not be prepared; review local files.'); process.exitCode = 1 }
}
module.exports = { configure }
