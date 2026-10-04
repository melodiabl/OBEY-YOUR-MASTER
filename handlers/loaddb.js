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
const SyncMap = require('./sync-map')

// EnmapLike importado desde ./enmap-like.js (solo para snipes y jointocreatemap ephemeral)

module.exports = async client => {
  const start = Date.now()
  console.log('[DB] Cargando base de datos MongoDB...'.brightGreen)

  client.db = { Guild: GuildSchema, User: UserSchema, Ticket: TicketSchema, Moderation: ModerationSchema }

  // SyncMap: wraps MongoDB con acceso sincrónico vía cache
  client.settings      = new SyncMap(GuildSchema)
  client.setups        = client.settings
  client.musicsettings = client.settings
  client.reactionrole  = client.settings
  client.social_log    = client.settings
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

  const stores = [...new Set(Object.values(client).filter(value => value instanceof SyncMap))]
  let initializing = false
  let retryTimer
  async function initializeDatabase() {
    if (initializing || client._dbReady || client._shuttingDown) return
    initializing = true
    try {
      await Promise.all(stores.map(store => store.preload()))
      const migrated = await require('./music/playlist-repository').migratePlaylists(require('../database/schemas/PlaylistSchema'), require('../database/schemas/MusicPlaylistSchema'))
      console.log(`[DB] Ready: ${client.settings.size} guilds, ${migrated} playlists reconciled`)
      client._dbReady = true
      client._dbError = null
      client.emit('dbReady')
    } catch (error) {
      client._dbReady = false
      client._dbError = error
      console.error('[DB] Initialization failed:', error.message)
      clearTimeout(retryTimer)
      retryTimer = setTimeout(initializeDatabase, 10000)
      retryTimer.unref?.()
    } finally { initializing = false }
  }
  client.once('ready', initializeDatabase)
  client.stopDatabaseInitialization = () => clearTimeout(retryTimer)
  client.flushDatabase = () => Promise.all([...new Set(Object.values(client).filter(value => value instanceof SyncMap))].map(store => store.flush()))

  console.log(`[DB] Listo en ${Date.now() - start}ms`.green)
}
