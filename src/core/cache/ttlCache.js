// Cache TTL simple en memoria (sin dependencias) para reducir lecturas a DB.
// Importante: no es persistente. Se invalida al reiniciar el proceso.
module.exports = class TTLCache {
  constructor ({ defaultTtlMs = 30_000, maxSize = 10_000 } = {}) {
    this.defaultTtlMs = defaultTtlMs
    this.maxSize = maxSize
    this._map = new Map()
  }

  get (key) {
    const hit = this._map.get(key)
    if (!hit) return undefined
    if (hit.expiresAt <= Date.now()) {
      this._map.delete(key)
      return undefined
    }
    return hit.value
  }

  set (key, value, ttlMs = this.defaultTtlMs) {
    if (this._map.size >= this.maxSize) {
      // Evicción simple: borra la primera entrada insertada.
      const firstKey = this._map.keys().next().value
      if (firstKey) this._map.delete(firstKey)
    }

    this._map.set(key, { value, expiresAt: Date.now() + ttlMs })
    return value
  }

  delete (key) {
    this._map.delete(key)
  }
}

