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
      async resolve(query, options) {
        // NodeLink requires a display segment even when Apple returns only an ID.
        const identifier = node.isNodeLink && typeof query === 'string'
          ? query.replace(/^(https:\/\/music\.apple\.com\/[a-z]{2}\/(?:artist|album))\/(\d+)$/, '$1/_/$2') : query
        const result = await node.rest.loadTracks(identifier, options)
        // NodeLink returns Apple artist tops as a collection with type artist.
        return node.isNodeLink && result?.loadType === 'artist' ? { ...result, loadType: 'playlist' } : result
      },
      // Optional catalog/lyrics plugins have no generic method in the typed SDK.
      async fetch({ endpoint, options = {} }) {
        if (endpoint === '/info') return node.info || node.rest.getInfo()
        if (!/^\/(?:loadsearch|lyrics|sessions\/[^/]+\/players\/\d+\/sponsorblock\/categories)(?:\?|$)/.test(endpoint)) throw Error('unsupported_node_plugin_route')
        const base = new URL(node.rest.url), url = new URL('/v4' + endpoint, base)
        for (const [key, value] of Object.entries(options.params || {})) if (value != null) url.searchParams.set(key, value)
        if (url.origin !== base.origin) throw Error('invalid_node_plugin_route')
        const response = await fetch(url, { method: options.method || 'GET', headers: { Authorization: node.password, ...options.headers },
          body: options.body == null ? undefined : JSON.stringify(options.body), signal: options.signal || AbortSignal.timeout(8000) })
        if (!response.ok) throw Error('node_plugin_unavailable')
        return response.status === 204 ? null : response.json()
      },
    },
  })
  return views.get(node)
}
// NyxLink's resolver hook keeps standard LavaSrc prefixes available on Java
// nodes; its built-in feature gate otherwise classifies them as NodeLink-only.
function resolveLavaSrcSearch({ query, source, signal }, node) {
  if (node.isNodeLink || !['spsearch', 'amsearch'].includes(source)) return null
  return node.rest.loadTracks(`${source}:${query}`, { signal, timeoutMs: node.manager.options.search?.timeoutMs || 8000 })
}
module.exports = { nodeView, resolveLavaSrcSearch }
