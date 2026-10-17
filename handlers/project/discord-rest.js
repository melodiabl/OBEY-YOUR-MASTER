const { Agent } = require('undici')

module.exports = function discordRestOptions() {
  return { timeout: 60_000, retries: 5, agent: new Agent({ pipelining: 1, keepAliveTimeout: 15_000 }) }
}
