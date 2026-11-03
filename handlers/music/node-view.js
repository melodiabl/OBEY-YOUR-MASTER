const views = new WeakMap()
function nodeView(node) {
  if (!node) return null
  if (!views.has(node)) views.set(node, {
    native: node,
    get name() { return node.identifier },
    get state() { return node.connected && node.sessionId ? 1 : node.destroyed ? 2 : 0 },
    get sessionId() { return node.sessionId },
    get stats() { return node.stats },
    get penalties() { return node.getPenalties?.() || 0 },
    rest: {
      resolve: (query, options) => node.rest.loadTracks(query, options),
      // Optional catalog/lyrics plugins have no generic method in the typed SDK.
      async fetch({ endpoint, options = {} }) {
        if (endpoint === '/info') return node.info || node.rest.getInfo()
        if (!/^\/(?:loadsearch|lyrics|sessions\/[^/]+\/players\/\d+\/sponsorblock\/categories)(?:\?|$)/.test(endpoint)) throw Error('unsupported_node_plugin_route')
        const base = new URL(node.rest.url), url = new URL('/v4' + endpoint, base)
        for (const [key, value] of Object.entries(options.params || {})) if (value != null) url.searchParams.set(key, value)
        if (url.origin !== base.origin) throw Error('invalid_node_plugin_route')
        const response = await fetch(url, { method: options.method || 'GET', headers: { Authorization: node.password, ...options.headers },
          body: options.body == null ? undefined : JSON.stringify(options.body), signal: AbortSignal.timeout(8000) })
        if (!response.ok) throw Error('node_plugin_unavailable')
        return response.status === 204 ? null : response.json()
      },
    },
  })
  return views.get(node)
}
module.exports = { nodeView }
