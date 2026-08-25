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
const MuteSchema          = require('../database/schemas/MuteSchema')
const EconomySchema       = require('../database/schemas/EconomySchema')
const BlacklistSchema     = require('../database/schemas/BlacklistSchema')
const StatsSchema         = require('../database/schemas/StatsSchema')
const UserProfileSchema   = require('../database/schemas/UserProfileSchema')
const AfkSchema           = require('../database/schemas/AfkSchema')
const InviteSchema        = require('../database/schemas/InviteSchema')
const { JTC1, JTC2, JTC3 } = require('../database/schemas/JTCSchema')
const BackupSchema        = require('../database/schemas/BackupSchema')
const NotesSchema         = require('../database/schemas/NotesSchema')
const TikTokSchema        = require('../database/schemas/TikTokSchema')
const YouTubeSchema       = require('../database/schemas/YouTubeSchema')
const JoinVCSchema        = require('../database/schemas/JoinVCSchema')
const RankingSchema       = require('../database/schemas/RankingSchema')
const RosterSchema        = require('../database/schemas/RosterSchema')
const QueueSavesSchema    = require('../database/schemas/QueueSavesSchema')

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
      const docs = await this.model.find().lean()
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

  // Enmap API: math — supports both (key, op, path, value) and (key, op, value, path)
  math(key, op, arg3, arg4) {
    key = String(key)
    this.ensure(key, {})
    const doc = this._cache.get(key)
    // detect arg order: if arg3 is a string it's the path, else it's the value
    const path   = typeof arg3 === 'string' ? arg3 : arg4
    const amount = typeof arg3 === 'string' ? arg4 : arg3
    const n = getPath(doc, path) || 0
    const result = (op === 'add' || op === '+') ? n + amount
      : (op === 'subtract' || op === '-') ? Math.max(0, n - amount)
      : (op === 'multiply' || op === '*') ? n * amount
      : n
    setPath(doc, path, result)
    this.model.findOneAndUpdate({ [this.guildKey]: key }, { $set: { [path]: result } }).catch(() => {})
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
      this.model.findOneAndUpdate({ [this.guildKey]: key }, { $push: { [path]: value } }, { upsert: true }).catch(() => {})
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

// EnmapLike importado desde ./enmap-like.js (solo para snipes y jointocreatemap ephemeral)

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

  // XP/ranking persistido en MongoDB (voicepoints comparte colección con points)
  client.points      = new SyncMap(RankingSchema, 'recordKey')
  client.voicepoints = client.points // mismo store, misma colección

  // Stores convertidos a SyncMap (persistencia MongoDB)
  client.mutes       = new SyncMap(MuteSchema)
  client.afkDB       = new SyncMap(AfkSchema)
  client.stats       = new SyncMap(StatsSchema)
  client.blacklist   = new SyncMap(BlacklistSchema, 'userId')
  client.economy     = new SyncMap(EconomySchema)
  client.userProfiles = new SyncMap(UserProfileSchema)

  // Stores migrados a MongoDB
  client.invitesdb    = new SyncMap(InviteSchema, 'entryKey')
  client.jtcsettings  = new SyncMap(JTC1)
  client.jtcsettings2 = new SyncMap(JTC2)
  client.jtcsettings3 = new SyncMap(JTC3)
  client.backupDB     = new SyncMap(BackupSchema)
  client.notes        = new SyncMap(NotesSchema, 'userId')
  client.roster       = new SyncMap(RosterSchema)
  client.tiktok       = new SyncMap(TikTokSchema, 'channelKey')
  client.youtube_log  = new SyncMap(YouTubeSchema, 'channelKey')
  client.joinvc       = new SyncMap(JoinVCSchema)
  client.queuesaves   = new SyncMap(QueueSavesSchema, 'userId')

  // Stores efímeros (en memoria está bien)
  client.snipes          = new EnmapLike()
  client.jointocreatemap = new Map()
  client.modActions      = new EnmapLike()

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
      client.mutes.preload(),
      client.afkDB.preload(),
      client.stats.preload(),
      client.blacklist.preload(),
      client.economy.preload(),
      client.userProfiles.preload(),
      client.invitesdb.preload(),
      client.jtcsettings.preload(),
      client.jtcsettings2.preload(),
      client.jtcsettings3.preload(),
      client.backupDB.preload(),
      client.notes.preload(),
      client.roster.preload(),
      client.tiktok.preload(),
      client.youtube_log.preload(),
      client.joinvc.preload(),
      client.queuesaves.preload(),
      client.points.preload(),
    ])
    console.log(`[DB] Precarga completa: ${client.settings.size} guilds en cache`.green)
    client._dbReady = true
    client.emit('dbReady')
  })

  console.log(`[DB] Listo en ${Date.now() - start}ms`.green)
}
