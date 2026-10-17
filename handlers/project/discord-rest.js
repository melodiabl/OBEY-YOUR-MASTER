const { Agent } = require('undici')
const { DefaultRestOptions } = require('@discordjs/rest')
const { performance } = require('node:perf_hooks')
const { createHash, randomUUID } = require('node:crypto')
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 12)
const log = row => console.warn('[Discord] Request timing:', JSON.stringify(row))

function discordRestOptions({ makeRequest = DefaultRestOptions.makeRequest, now = () => performance.now(), write = log, onMessageRateLimit } = {}) {
  let lastRateLimit = -Infinity
  return { timeout: 60_000, retries: 5, agent: new Agent({ pipelining: 1, keepAliveTimeout: 15_000 }),
    async makeRequest(url, options) {
      const start = now()
      const channel = String(url).match(/\/channels\/([0-9]+)\/messages\//)?.[1]
      const tracked = channel && options.method === 'PATCH'
      const requestId = tracked ? randomUUID() : null
      let response
      try {
        response = await makeRequest(url, options)
        if (tracked && typeof response.json === 'function') {
          const read = response.json.bind(response)
          response.json = async (...args) => {
            const began = now()
            try { return await read(...args) }
            finally {
              const durationMs = Math.round(now() - began)
              if (durationMs >= 1000) write({ event: 'discord_slow_body', requestId, entryPoint: 'message_patch_body', channel: hash(channel), durationMs })
            }
          }
        }
        return response
      }
      finally {
        const durationMs = Math.round(now() - start)
        const limited = response?.status === 429
        const report = limited ? now() - lastRateLimit >= 10000 : durationMs >= 1000
        const retryAfter = response?.headers?.get('retry-after')
        const retryAfterMs = limited && retryAfter != null && Number.isFinite(Number(retryAfter)) ? Number(retryAfter) * 1000 : null
        if (tracked && limited) onMessageRateLimit?.(channel, retryAfterMs)
        if (tracked && report) {
          if (limited) lastRateLimit = now()
          write({
          event: limited ? 'discord_http_rate_limit' : 'discord_slow_http', requestId, entryPoint: 'message_patch',
          channel: hash(channel), durationMs, statusCode: response?.status ?? null,
          retryAfterMs,
        })
        }
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
