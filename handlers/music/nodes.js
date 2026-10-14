function createNodePool(entries, { preferenceFor = () => 'auto', now = Date.now } = {}) {
  const registry = new Map(entries.map(entry => [entry.id, entry]))
  const cooldowns = new Map(), pins = new Map(), information = new Map()
  let manager, disposed = false
  const publicId = id => registry.get(id)?.visibility === 'public' ? id : 'auto'
  function available(name) {
    return registry.get(name)?.enabled && manager?.nodes.get(name)?.state === 1 && (cooldowns.get(name) || 0) <= now()
  }
  function candidates(guildId, { preference = preferenceFor(guildId), exclude = [] } = {}) {
    const preferred = pins.get(guildId) || preference
    return [...(manager?.nodes.values() || [])].filter(node => available(node.name) && !exclude.includes(node.name))
      .sort((a, b) => Number(b.name === preferred) - Number(a.name === preferred) ||
        Number(registry.get(a.name).visibility !== 'private') - Number(registry.get(b.name).visibility !== 'private') ||
        registry.get(a.name).priority - registry.get(b.name).priority || (a.penalties || 0) - (b.penalties || 0))
  }
  async function readInfo(name) {
    const node = manager?.nodes.get(name)
    if (typeof node?.rest?.fetch !== 'function') return
    try {
      const info = await node.rest.fetch({ endpoint: '/info', options: {} })
      if (!disposed && info?.version?.major === 4 && Array.isArray(info.sourceManagers)) information.set(name, info)
    } catch { /* A provider can connect while optional capability inspection is unavailable. */ }
  }
  function onReady(name) { cooldowns.delete(name); readInfo(name) }
  function view(guildId) {
    const active = manager?.players.get(guildId)?.node || candidates(guildId)[0]
    return { preferenceId: publicId(preferenceFor(guildId)), currentId: publicId(active?.name), nodes: entries.filter(entry => entry.visibility === 'public').map(entry => {
      const node = manager?.nodes.get(entry.id)
      return { id: entry.id, label: entry.label, status: !entry.enabled ? 'disabled' : available(entry.id) ? 'online' : node?.state === 0 ? 'connecting' : 'offline',
        version: information.get(entry.id)?.version?.semver || null }
    }) }
  }
  function validateSelection(id) {
    if (id === 'auto') return id
    const entry = registry.get(id)
    if (!entry || entry.visibility !== 'public' || !entry.enabled) throw new Error('node_not_available')
    if (!available(id)) throw new Error('node_unavailable')
    return id
  }
  return {
    attach(value) { manager = value; manager.on('ready', onReady); for (const name of manager.nodes.keys()) readInfo(name) },
    candidates, choose: (guildId, options) => candidates(guildId, options)[0], view, validateSelection,
    pin(guildId, name) { if (!registry.has(name)) throw new Error('node_not_available'); pins.set(guildId, name) },
    unpin: guildId => pins.delete(guildId),
    fail: name => cooldowns.set(name, now() + 30000), recover: name => cooldowns.delete(name),
    supportsPlugin: (name, plugin) => Boolean(information.get(name)?.plugins?.some(value => value.name.toLowerCase().includes(plugin))),
    dispose() { disposed = true; manager?.off('ready', onReady); pins.clear(); cooldowns.clear(); information.clear() },
  }
}
module.exports = { createNodePool }
