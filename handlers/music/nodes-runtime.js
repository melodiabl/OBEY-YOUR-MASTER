const { Shoukaku, Connectors } = require('shoukaku')
const { loadNodeConfig } = require('./nodes-config')
const { createNodePool } = require('./nodes')
function initializeNodes(client, config) {
  const entries = loadNodeConfig({ legacyNodes: config.clientsettings?.nodes || [] })
  const pool = createNodePool(entries, { defaultNodeId: process.env.LAVALINK_DEFAULT_NODE || 'auto', preferenceFor: guildId => guildId ? client.music?.getState(guildId)?.nodePreference || 'auto' : 'auto' })
  client.nodePool = pool
  const reconnect = new Map(), attempts = new Map()
  client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), entries.filter(entry => entry.enabled).map(entry => ({ name: entry.id, url: entry.url, auth: entry.auth, secure: entry.secure })), {
    resume: true, resumeTimeout: 60, resumeByLibrary: false, moveOnDisconnect: false,
    reconnectTries: 1, reconnectInterval: 1, restTimeout: 10,
    nodeResolver: (nodes, connection) => pool.choose(connection?.guildId),
  })
  pool.attach(client.shoukaku)
  function retry(name) {
    if (client._shuttingDown || reconnect.has(name)) return
    const entry = entries.find(value => value.id === name && value.enabled)
    if (!entry) return
    const attempt = (attempts.get(name) || 0) + 1
    attempts.set(name, attempt)
    const timer = setTimeout(() => {
      reconnect.delete(name)
      if (client._shuttingDown || client.shoukaku.nodes.get(name)?.state === 1) return
      try {
        if (client.shoukaku.nodes.has(name)) client.shoukaku.removeNode(name, 'Scheduled reconnect')
        client.shoukaku.addNode({ name: entry.id, url: entry.url, auth: entry.auth, secure: entry.secure })
      } catch { retry(name) }
    }, Math.min(120000, 5000 * 2 ** Math.min(attempt - 1, 5)))
    timer.unref?.(); reconnect.set(name, timer)
  }
  client.shoukaku.on('ready', name => {
    clearTimeout(reconnect.get(name)); reconnect.delete(name); attempts.delete(name); pool.recover(name)
    console.log('[Lavalink] Conexión disponible: ' + (entries.find(entry => entry.id === name)?.visibility === 'private' ? 'interna' : name))
  })
  client.shoukaku.on('error', name => { pool.fail(name); console.warn('[Lavalink] Conexión no disponible'); retry(name) })
  client.shoukaku.on('disconnect', name => { pool.fail(name); retry(name) })
  client.stopNodes = () => { for (const timer of reconnect.values()) clearTimeout(timer); reconnect.clear(); pool.dispose() }
  return pool
}
async function configureSponsorBlock(player, pool) {
  const node = player?.node
  if (!node?.sessionId || !pool?.supportsPlugin(node.name, 'sponsorblock')) return
  try {
    await node.rest.fetch({ endpoint: '/sessions/' + encodeURIComponent(node.sessionId) + '/players/' + encodeURIComponent(player.guildId) + '/sponsorblock/categories',
      options: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic'] } })
  } catch { console.warn('[Music] SponsorBlock no disponible en la conexión actual') }
}
module.exports = { initializeNodes, configureSponsorBlock }
