// Explicit CLI: public node passwords only; no Discord token, voice or user data.
const path = require('node:path')
const { loadNodeConfig } = require('../handlers/music/nodes-config')
const { benchmark } = require('../handlers/music/node-benchmark')
async function main() {
  const registry = path.resolve(process.argv[2] || path.join(__dirname, '../.runtime/nodes/nodes.json'))
  const entries = loadNodeConfig({ env: { LAVALINK_PRIVATE_ENABLED: 'false', LAVALINK_NODES_FILE: registry } })
  const nodes = await benchmark(entries)
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), scope: 'Bot host to public node, not Discord voice latency or audio playback', nodes }, null, 2))
  if (!nodes.some(node => node.usable)) process.exitCode = 1
}
if (require.main === module) main().catch(() => { console.error('No se pudo completar la medición de nodos. Revisa el registro local.'); process.exitCode = 1 })
module.exports = { main }
