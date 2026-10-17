const { Agent } = require('undici')
const { DefaultRestOptions } = require('@discordjs/rest')
const { performance } = require('node:perf_hooks')
const { createHash, randomUUID } = require('node:crypto')
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 12)
const log = row => console.warn('[Discord] Request timing:', JSON.stringify(row))

function discordRestOptions({ makeRequest = DefaultRestOptions.makeRequest, now = () => performance.now(), write = log } = {}) {
  return { timeout: 60_000, retries: 5, agent: new Agent({ pipelining: 1, keepAliveTimeout: 15_000 }),
    async makeRequest(url, options) {
      const start = now()
      let response
      try { response = await makeRequest(url, options); return response }
      finally {
        const durationMs = Math.round(now() - start)
        const channel = String(url).match(/\/channels\/([0-9]+)\/messages\//)?.[1]
        if (channel && options.method === 'PATCH' && durationMs >= 1000) write({
          event: 'discord_slow_http', requestId: randomUUID(), entryPoint: 'message_patch',
          channel: hash(channel), durationMs, statusCode: response?.status ?? null,
        })
      }
    },
  }
}

function observeRateLimits(rest, { now = Date.now, write = log } = {}) {
  let last = -Infinity
  const listener = data => {
    if (!data.global && !(data.method === 'PATCH' && /\/messages(?:\/|$)/.test(data.route))) return
    const at = now()
    if (at - last < 10000) return
    last = at
    write({ event: 'discord_rate_limit', requestId: randomUUID(), entryPoint: data.global ? 'global_rest' : 'message_patch',
      channel: hash(data.majorParameter), waitMs: Number.isFinite(data.timeToReset) ? data.timeToReset : null,
      limit: Number.isFinite(data.limit) ? data.limit : null })
  }
  rest.on('rateLimited', listener)
  return () => rest.off('rateLimited', listener)
}

module.exports = { discordRestOptions, observeRateLimits }
