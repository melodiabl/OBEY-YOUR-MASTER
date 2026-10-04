// Registry is metadata plus references to existing services, never a second runtime.
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

function createModuleRegistry() {
  const modules = new Map()
  return {
    register(manifest, service) {
      const objects = ['defaults', 'permissions', 'commands', 'events', 'realtime', 'capabilities']
      const arrays = ['interactions', 'jobs', 'api', 'dependencies']
      if (!manifest || !/^[a-z][a-z0-9-]*$/.test(manifest.id) || !/^\d+\.\d+\.\d+$/.test(manifest.version)
        || objects.some(key => !manifest[key] || typeof manifest[key] !== 'object' || Array.isArray(manifest[key]))
        || arrays.some(key => !Array.isArray(manifest[key]))) throw new Error('Invalid module manifest')
      if (modules.has(manifest.id)) throw new Error(`Duplicate module: ${manifest.id}`)
      const entry = Object.freeze({ manifest: freeze(structuredClone(manifest)), service })
      modules.set(manifest.id, entry)
      return entry
    },
    get: id => modules.get(id),
    list: () => [...modules.values()].map(entry => entry.manifest),
  }
}

module.exports = { createModuleRegistry }
