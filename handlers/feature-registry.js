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
        || arrays.some(key => !Array.isArray(manifest[key]))) throw new Error('Invalid feature manifest')
      if (modules.has(manifest.id)) throw new Error(`Duplicate feature: ${manifest.id}`)
      const entry = Object.freeze({ manifest: freeze(structuredClone(manifest)), service })
      modules.set(manifest.id, entry)
      return entry
    },
    get: id => modules.get(id),
    list: () => [...modules.values()].map(entry => entry.manifest),
    resolveCapability(id, name) {
      const entry = modules.get(id)
      if (!entry || typeof name !== 'string') return null
      const parts = name.split('.')
      if (parts.length > 2 || parts.length === 2 && parts[0] !== id) return null
      const alias = parts.at(-1)
      const action = ({ read: 'view', edit: 'configure', manage: 'configure' })[alias] || alias
      const permission = action === 'view' ? 'read' : action
      if (!Object.hasOwn(entry.manifest.permissions, permission)) return null
      return Object.freeze({ id: `${id}.${action}`, policy: entry.manifest.permissions[permission] })
    },
  }
}

module.exports = { createModuleRegistry }
