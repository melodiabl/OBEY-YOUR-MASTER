/**
 * loaddb.js — MongoDB con Mongoose + wrapper sincrónico compatible con Enmap
 *
 * Toda la API es SINCRÓNICA (como Enmap original).
 * Los writes a MongoDB ocurren en segundo plano (fire-and-forget).
 * En el evento 'ready' se precarga todo desde MongoDB al cache.
 */
const EnmapLike           = require('./enmap-like')
const GuildSchema         = require('../database/schemas/GuildSchema')
const UserSchema          = require('../database/schemas/UserSchema')
const TicketSchema        = require('../database/schemas/TicketSchema')
const ModerationSchema    = require('../database/schemas/ModerationSchema')
const KeywordSchema       = require('../database/schemas/KeywordSchema')
const CustomCommandSchema = require('../database/schemas/CustomCommandSchema')
const PremiumSchema       = require('../database/schemas/PremiumSchema')

// ─── Helpers para dot-notation path ──────────────────────────────────────────
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
  }

  // Precargar todos los docs desde MongoDB (llamar en ready)
  async preload() {
    try {
      const docs = await this.model.find({}).lean()
      for (const doc of docs) {
        const key = doc[this.guildKey]
        if (key) this._cache.set(String(key), doc)
      }
    } catch (e) { /* si falla, arranca con cache vacío */ }
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
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $setOnInsert: defaultValue || {} }, { upsert: true }).catch(() => {})
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
        this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: toSet }).catch(() => {})
      }
    }
    if (path) {
      const doc = this._cache.get(key)
      if (doc && !hasPath(doc, path)) {
        const val = typeof defaultValue === 'object' ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue
        setPath(doc, path, val)
        this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: val } }).catch(() => {})
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
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: value } }, { upsert: true }).catch(() => {})
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(doc, value)
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: value }, { upsert: true }).catch(() => {})
    } else {
      this._cache.set(key, { [this.guildKey]: key, value })
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { value } }, { upsert: true }).catch(() => {})
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
  delete(key) {
    key = String(key)
    this._cache.delete(key)
    this.model.deleteOne({ [this.guildKey]: key }).catch(() => {})
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
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: filtered } }).catch(() => {})
    }
  }

  // Enmap API: math(key, op, path, value)
  math(key, op, path, value) {
    key = String(key)
    this.ensure(key, {})
    const doc = this._cache.get(key)
    const n = getPath(doc, path) || 0
    const result = op === 'add' ? n + value : op === 'subtract' ? Math.max(0, n - value) : op === 'multiply' ? n * value : n
    setPath(doc, path, result)
    this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: result } }).catch(() => {})
  }

  // Enmap API: inc(key, path)
  inc(key, path) { this.math(String(key), 'add', path, 1) }

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

// EnmapLike importado desde ./enmap-like.js

// ─── PointsCache: XP en memoria ──────────────────────────────────────────────
class PointsCache {
  constructor() { this._data = new Map() }
  ensure(key, def) {
    key = String(key)
    if (!this._data.has(key)) this._data.set(key, { ...def })
    return this._data.get(key)
  }
  get(key, prop) {
    const d = this._data.get(String(key))
    if (!d) return prop ? 0 : null
    return prop ? (d[prop] ?? 0) : d
  }
  set(key, prop, value) { const d = this.ensure(String(key), {}); d[prop] = value }
  math(key, op, prop, value) {
    const d = this.ensure(String(key), {})
    d[prop] = op === 'add' ? (d[prop] || 0) + value : Math.max(0, (d[prop] || 0) - value)
  }
  inc(key, prop) { this.math(String(key), 'add', prop, 1) }
  filter(fn) {
    const keys = []
    for (const [k, v] of this._data) { if (fn(v)) keys.push(k) }
    return { _keys: keys, keyArray() { return this._keys } }
  }
  keyArray() { return [...this._data.keys()] }
}

module.exports = async client => {
  const start = Date.now()
  console.log('[DB] Cargando base de datos MongoDB...'.brightGreen)

  client.db = { Guild: GuildSchema, User: UserSchema, Ticket: TicketSchema, Moderation: ModerationSchema }

  // SyncMap: wraps MongoDB con acceso sincrónico vía cache
  client.settings      = new SyncMap(GuildSchema)
  client.setups        = new SyncMap(GuildSchema)
  client.musicsettings = new SyncMap(GuildSchema)
  client.reactionrole  = new SyncMap(GuildSchema)
  client.social_log    = new SyncMap(GuildSchema)
  client.keyword        = new SyncMap(KeywordSchema)
  client.customcommands = new SyncMap(CustomCommandSchema)
  client.premium        = new SyncMap(PremiumSchema)

  // XP/puntos en memoria
  client.points      = new PointsCache()
  client.voicepoints = new PointsCache()

  // Stores en memoria pura (sin persistencia necesaria)
  client.mutes       = new EnmapLike()
  client.afkDB       = new EnmapLike()
  client.invitesdb   = new EnmapLike()
  client.snipes      = new EnmapLike()
  client.stats       = new EnmapLike()
  // join-to-create voice channel settings
  client.jtcsettings     = new EnmapLike()
  client.jtcsettings2    = new EnmapLike()
  client.jtcsettings3    = new EnmapLike()
  client.jointocreatemap = new Map()  // Map simple: tempvoice y owner tracking

  // Stores adicionales en memoria usados por handlers legacy
  client.backupDB     = new EnmapLike()
  client.blacklist    = new EnmapLike()
  client.economy      = new EnmapLike()
  client.notes        = new EnmapLike()
  client.roster       = new EnmapLike()
  client.joinvc       = new EnmapLike()
  client.tiktok       = new EnmapLike()
  client.youtube_log  = new EnmapLike()
  client.userProfiles = new EnmapLike()

  // Advertisement feature (inicialización por defecto)
  client.ad = { enabled: false, statusad: null, spacedot: ' • ', textad: '' }

  // Helpers de alto nivel
  client.getGuild    = (guildId) => GuildSchema.findOne({ guildId }).lean()
  client.getUser     = (userId, guildId) => UserSchema.findOne({ userId, guildId }).lean()
  client.upsertGuild = (guildId, data) => GuildSchema.findOneAndUpdate({ guildId }, { $set: data }, { upsert: true, new: true })
  client.upsertUser  = (userId, guildId, data) => UserSchema.findOneAndUpdate({ userId, guildId }, { $set: data }, { upsert: true, new: true })

  // Precargar guilds en el evento ready
  client.once('ready', async () => {
    console.log('[DB] Precargando datos de guilds desde MongoDB...'.cyan)
    await Promise.all([
      client.settings.preload(),
      client.setups.preload(),
      client.musicsettings.preload(),
      client.reactionrole.preload(),
      client.social_log.preload(),
      client.keyword.preload(),
      client.customcommands.preload(),
      client.premium.preload(),
    ])
    console.log(`[DB] Precarga completa: ${client.settings.size} guilds en cache`.green)
  })

  console.log(`[DB] Listo en ${Date.now() - start}ms`.green)
}
