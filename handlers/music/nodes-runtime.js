const { Manager, Connectors } = require('nyxlink')
const { loadNodeConfig } = require('./nodes-config')
const { createNodePool } = require('./nodes')
const { nodeView, resolveLavaSrcSearch } = require('./node-view')
function initializeNodes(client, config) {
  const entries = loadNodeConfig({ legacyNodes: config.clientsettings?.nodes || [] })
  if (!entries.some(entry => entry.enabled)) throw Error('no_audio_nodes_configured')
  const manager = new Manager({
    nodes: entries.filter(entry => entry.enabled).map(entry => {
      const url = new URL('http://' + entry.url)
      return { identifier: entry.id, host: url.hostname, port: Number(url.port), password: entry.auth, secure: entry.secure, priority: entry.priority }
    }),
    options: {
      database: { type: 'memory' }, resume: true, resumeTimeout: 60000,
      node: { selectionStrategy: 'priority', autoMovePlayers: true, avoidUnhealthyNodes: true,
        retryAmount: 20, retryDelay: 5000, failover: { maxAttempts: 3, retryDelayMs: 250, preserveOnFailure: true } },
      search: { defaultPlatform: 'youtubemusic', resultLimit: 50, timeoutMs: 8000, resolver: resolveLavaSrcSearch },
      sources: { disabledSources: ['jiosaavn', 'soundcloud', 'deezer', 'pornhub', 'soundgasm', 'hentai', 'nsfw', 'tts'] },
      defaultPlayer: { selfDeaf: true, autoPlay: false, historySize: 10 },
      trackHandling: { autoSkipOnError: true, skipStuckTracks: true, retryFailedTracks: false },
    },
  })
  client.nyxlink = manager
  const pool = createNodePool(entries, { defaultNodeId: process.env.LAVALINK_DEFAULT_NODE || 'auto',
    preferenceFor: guildId => (guildId ? client.music?.getState(guildId)?.nodePreference : null) || 'auto' })
  client.nodePool = pool
  pool.attach(manager)
  const search = manager.search.bind(manager)
  manager.search = async query => {
    const result = await search(query)
    const { viewTrack } = require('./tracks')
    result.tracks = result.tracks.filter(track => require('./nodes-config').allowedMusicTrack(viewTrack(track)))
    return result
  }
  manager.on('nodeReady', node => { pool.recover(node.identifier); console.info('[Audio] Nodo disponible: ' + (entries.find(e => e.id === node.identifier)?.visibility === 'private' ? 'interno' : node.identifier)) })
  manager.on('nodeError', node => { pool.fail(node.identifier); console.warn('[Audio] Conexión no disponible') })
  manager.on('nodeDisconnect', node => pool.fail(node.identifier))
  manager.use(new Connectors.DiscordJs(), client)
  client.stopNodes = () => pool.dispose()
  return pool
}
async function configureSponsorBlock(player, pool) {
  const node = nodeView(player?.node)
  if (!node?.sessionId || !pool?.supportsPlugin(node.name, 'sponsorblock')) return
  try {
    await node.rest.fetch({ endpoint: '/sessions/' + encodeURIComponent(node.sessionId) + '/players/' + encodeURIComponent(player.guildId) + '/sponsorblock/categories',
      options: { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic'] } })
  } catch { console.warn('[Music] SponsorBlock no disponible en la conexión actual') }
}
module.exports = { initializeNodes, configureSponsorBlock }
