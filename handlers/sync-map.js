function getPath(obj, path) {
  if (!path || typeof path !== 'string') return obj
  return path.split('.').reduce((o, k) => (o != null && typeof o === 'object' ? o[k] : undefined), obj)
}
function setPath(obj, path, value) {
  if (!path || typeof path !== 'string') return value
  const keys = path.split('.')
  if (keys.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) throw new Error('Invalid data path')
  const last = keys.pop()
  let cur = obj
  for (const k of keys) { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k] }
  cur[last] = value
  return obj
}
function hasPath(obj, path) {
  if (!path) return obj != null
  return getPath(obj, path) !== undefined
}

// ─── SyncMap: API 100% sincrónica + persistencia MongoDB en background ────────
class SyncMap {
  constructor(model, guildKey = 'guildId') {
    this.model    = model
    this.guildKey = guildKey
    this._cache   = new Map()
    this._writes = Promise.resolve()
    this._errors = []
  }

  persist(operation) {
    this._writes = this._writes.then(() => operation()).catch(error => {
      this._errors.push(error)
      console.error(`[DB] ${this.model.modelName} write failed:`, error.message)
    })
  }

  async flush() {
    await this._writes
    if (this._errors.length) {
      const errors = this._errors.splice(0)
      throw new AggregateError(errors, 'No se pudieron guardar los cambios')
    }
  }

  // Precargar todos los docs desde MongoDB (llamar en ready)
  async preload() {
    try {
      const docs = await this.model.find().lean()
      for (const doc of docs) {
        const key = doc[this.guildKey]
        if (key) this._cache.set(String(key), doc)
      }
    } catch (error) { throw new Error(`Preload ${this.model.modelName}: ${error.message}`) }
  }

  // Enmap API: ensure(key, defaultValue, path?)
  ensure(key, defaultValue, path) {
    key = String(key)
    if (!this._cache.has(key)) {
      // Nuevo guild: crear con los defaults
      const obj = typeof defaultValue === 'object' && defaultValue !== null
        ? { [this.guildKey]: key, ...JSON.parse(JSON.stringify(defaultValue)) }
        : { [this.guildKey]: key }
      this._cache.set(key, obj)
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $setOnInsert: defaultValue || {} }, { upsert: true }))
    } else if (!path && typeof defaultValue === 'object' && defaultValue !== null) {
      // Guild existente: merge de campos faltantes (ej. "embed", "suggest", etc.)
      const doc = this._cache.get(key)
      const toSet = {}
      for (const [k, v] of Object.entries(defaultValue)) {
        if (doc[k] === undefined) {
          doc[k] = typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v
          toSet[k] = v
        }
      }
      if (Object.keys(toSet).length > 0) {
        this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: toSet }))
      }
    }
    if (path) {
      const doc = this._cache.get(key)
      if (doc && !hasPath(doc, path)) {
        const val = typeof defaultValue === 'object' ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue
        setPath(doc, path, val)
        this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: val } }))
      }
    }
    return this._cache.get(key)
  }

  // Enmap API: get(key, path?)
  get(key, path) {
    if (!key) return null
    key = String(key)
    const doc = this._cache.get(key)
    if (!doc) return null
    if (path) return getPath(doc, path) ?? null
    return doc
  }

  // Enmap API: set(key, value, path?)  ← value BEFORE path (Enmap order)
  set(key, value, path) {
    key = String(key)
    this.ensure(key, {})
    const doc = this._cache.get(key)
    if (path) {
      setPath(doc, path, value)
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: value } }, { upsert: true }))
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(doc, value)
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: value }, { upsert: true }))
    } else {
      this._cache.set(key, { [this.guildKey]: key, value })
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { value } }, { upsert: true }))
    }
  }

  // Enmap API: has(key, path?)
  has(key, path) {
    key = String(key)
    const doc = this._cache.get(key)
    if (!doc) return false
    if (!path) return true
    return hasPath(doc, path)
  }

  // Enmap API: delete(key)
  delete(key, path) {
    key = String(key)
    if (path) {
      const keys = path.split('.')
      if (keys.some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('Invalid data path')
      const last = keys.pop(), parent = keys.length ? getPath(this._cache.get(key), keys.join('.')) : this._cache.get(key)
      if (parent) delete parent[last]
      this.persist(() => this.model.updateOne({ [this.guildKey]: key }, { $unset: { [path]: 1 } }))
      return
    }
    this._cache.delete(key)
    this.persist(() => this.model.deleteOne({ [this.guildKey]: key }))
  }

  // Enmap API: remove(key, val, path?) — removes val from array at path
  remove(key, val, path) {
    key = String(key)
    const doc = this._cache.get(key)
    if (!doc) return
    const arr = path ? getPath(doc, path) : doc
    if (!Array.isArray(arr)) return
    const fn = typeof val === 'function' ? val : v => v === val
    const filtered = arr.filter(v => !fn(v))
    if (path) {
      setPath(doc, path, filtered)
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: filtered } }))
    }
  }

  // Enmap API: math — supports both (key, op, path, value) and (key, op, value, path)
  math(key, op, arg3, arg4) {
    key = String(key)
    this.ensure(key, {})
    const doc = this._cache.get(key)
    // detect arg order: if arg3 is a string it's the path, else it's the value
    const path   = typeof arg3 === 'string' ? arg3 : arg4
    const amount = typeof arg3 === 'string' ? arg4 : arg3
    if (!Number.isFinite(amount)) throw new Error('La cantidad debe ser un número válido')
    const n = Number(getPath(doc, path) || 0)
    if (!Number.isFinite(n)) throw new Error('El saldo guardado no es válido')
    const result = (op === 'add' || op === '+') ? n + amount
      : (op === 'subtract' || op === '-') ? Math.max(0, n - amount)
      : (op === 'multiply' || op === '*') ? n * amount
      : n
    if (!Number.isFinite(result)) throw new Error('El resultado no es un número válido')
    setPath(doc, path, result)
    this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: result } }))
  }

  // Enmap API: inc(key, path)
  inc(key, path) { this.math(String(key), 'add', path, 1) }

  // Enmap API: push(key, value, path?)
  push(key, value, path) {
    key = String(key)
    this.ensure(key, {})
    const doc = this._cache.get(key)
    if (path) {
      const arr = getPath(doc, path) || []
      arr.push(value)
      setPath(doc, path, arr)
      this.persist(() => this.model.findOneAndUpdate({ [this.guildKey]: key }, { $push: { [path]: value } }, { upsert: true }))
    }
  }

  // Enmap API: find(fn) / findKey(fn)
  find(fn) {
    for (const v of this._cache.values()) { try { if (fn(v)) return v } catch {} }
    return null
  }

  findKey(fn) {
    for (const [k, v] of this._cache) { try { if (fn(v)) return k } catch {} }
    return null
  }

  // Enmap API: filter(fn) — returns { keyArray() }
  filter(fn) {
    const keys = [], vals = []
    for (const [k, v] of this._cache) { try { if (fn(v)) { keys.push(k); vals.push(v) } } catch {} }
    return { _keys: keys, _vals: vals, keyArray() { return this._keys }, array() { return this._vals }, filterArray(f) { return this._vals.filter(f) } }
  }

  // Enmap API: filterArray(fn) — returns array of matching values
  filterArray(fn) {
    const vals = []
    for (const [, v] of this._cache) { try { if (fn(v)) vals.push(v) } catch {} }
    return vals
  }

  // Enmap API: array() — returns all values as array
  array() { return [...this._cache.values()] }

  keyArray() { return [...this._cache.keys()] }
  entries()  { return this._cache.entries() }
  forEach(fn) { this._cache.forEach(fn) }
  each(fn)    { this._cache.forEach(fn) }
  get size()  { return this._cache.size }
}

module.exports = SyncMap
