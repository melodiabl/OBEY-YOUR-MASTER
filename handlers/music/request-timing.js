const { performance } = require('node:perf_hooks')
const { createHash, randomUUID } = require('node:crypto')

async function measureRequest(guildId, entryPoint, operation, {
  now = () => performance.now(), write = row => console.warn('[Music] Request timing:', JSON.stringify(row)),
} = {}) {
  const start = now()
  let succeeded = false
  try { const result = await operation(); succeeded = true; return result }
  finally {
    const durationMs = Math.round(now() - start)
    if (durationMs >= 1000) write({ event: 'music_slow_request', requestId: randomUUID(), entryPoint,
      guild: createHash('sha256').update(String(guildId)).digest('hex').slice(0, 12), durationMs, succeeded })
  }
}

module.exports = { measureRequest }
