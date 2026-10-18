const EnmapLike = require('./enmap-like')
// Legacy feature API over one owned Guild root. Event counters stay ephemeral.
function createSettingsView(store, root, { transientKeys = false } = {}) {
  if (!['antinuke', 'epicgames'].includes(root)) throw new Error('invalid_settings_view')
  const transient = new EnmapLike()
  const temporary = key => transientKeys && !/^\d{17,20}$/.test(String(key))
  const pathFor = path => path ? `${root}.${path}` : root
  const view = {
    get(key, path) { return temporary(key) ? transient.get(key, path) : store.get(key, pathFor(path)) },
    ensure(key, defaults, path) {
      if (temporary(key)) return transient.ensure(key, defaults, path)
      store.ensure(key, {})
      if (path || !view.get(key)) store.ensure(key, defaults, pathFor(path))
      else if (defaults && typeof defaults === 'object') for (const [name, value] of Object.entries(defaults)) store.ensure(key, value, `${root}.${name}`)
      return view.get(key)
    },
    set(key, value, path) { if (temporary(key)) transient.set(key,value,path); else store.set(key,value,pathFor(path)); return view },
    push(key, value, path) {
      if (temporary(key)) {
        const previous = transient.get(key,path) || []
        if (!Array.isArray(previous)) throw new Error('invalid_counter')
        transient.set(key,[...previous,value],path)
      } else store.push(key,value,pathFor(path))
      return view
    },
    find(predicate) { for (const doc of store.array()) if (doc[root] && predicate(doc[root])) return doc[root]; return transient.find(predicate) },
  }
  return view
}
module.exports = { createSettingsView }
