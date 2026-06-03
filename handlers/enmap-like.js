/**
 * EnmapLike — in-memory store compatible con la API de Enmap
 * Importar donde se necesite: const EnmapLike = require('./enmap-like')
 */

function getPath(obj, path) {
  if (!path || typeof path !== 'string') return obj
  return path.split('.').reduce((o, k) => (o != null && typeof o === 'object' ? o[k] : undefined), obj)
}
function setPath(obj, path, value) {
  if (!path || typeof path !== 'string') return value
  const keys = path.split('.')
  const last = keys.pop()
  let cur = obj
  for (const k of keys) { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k] }
  cur[last] = value
  return obj
}

class EnmapLike {
  constructor() { this._data = new Map() }

  ensure(key, def, path) {
    key = String(key)
    if (!this._data.has(key)) {
      this._data.set(key, typeof def === 'object' && def !== null ? JSON.parse(JSON.stringify(def)) : def)
    }
    const val = this._data.get(key)
    if (path && getPath(val, path) === undefined) setPath(val, path, def)
    return this._data.get(key)
  }

  get(key, path) {
    const val = this._data.get(String(key))
    if (val === undefined) return null
    if (path) return getPath(val, path) ?? null
    return val
  }

  set(key, value, path) {
    key = String(key)
    if (path) { this.ensure(key, {}); setPath(this._data.get(key), path, value) }
    else this._data.set(key, value)
    return this
  }

  has(key, path) {
    key = String(key)
    if (!this._data.has(key)) return false
    if (path) return getPath(this._data.get(key), path) !== undefined
    return true
  }

  delete(key) { this._data.delete(String(key)) }

  remove(key, val, path) {
    key = String(key)
    const obj = this._data.get(key)
    if (!obj) return
    const arr = path ? getPath(obj, path) : obj
    if (!Array.isArray(arr)) return
    const fn = typeof val === 'function' ? val : v => v === val
    const filtered = arr.filter(v => !fn(v))
    if (path) setPath(obj, path, filtered)
    else this._data.set(key, filtered)
  }

  math(key, op, path, value) {
    key = String(key)
    this.ensure(key, {})
    const obj = this._data.get(key)
    const n = getPath(obj, path) || 0
    setPath(obj, path, op === 'add' ? n + value : op === 'subtract' ? Math.max(0, n - value) : n)
  }

  inc(key, path) { this.math(String(key), 'add', path, 1) }

  filter(fn) {
    const keys = []
    for (const [k, v] of this._data) { try { if (fn(v)) keys.push(k) } catch {} }
    return { _keys: keys, keyArray() { return this._keys } }
  }

  keyArray() { return [...this._data.keys()] }
  entries()  { return this._data.entries() }
  forEach(fn) { this._data.forEach(fn) }
  each(fn)    { this._data.forEach(fn) }
  get size()  { return this._data.size }
}

module.exports = EnmapLike
