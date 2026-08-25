// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música v2: capa de base de datos (MongoDB/Mongoose).
// Expone la API `client.database.*` (arquitectura adaptada de Soundy).
// Reutiliza schemas existentes de OBEY donde es posible (LikedSongs).
// ─────────────────────────────────────────────────────────────────────────────
const MusicGuild  = require('../../database/schemas/MusicGuildSchema')
const TrackStats  = require('../../database/schemas/TrackStatsSchema')
const UserStats   = require('../../database/schemas/UserStatsSchema')
const UserVote    = require('../../database/schemas/UserVoteSchema')
const Playlist    = require('../../database/schemas/MusicPlaylistSchema')
const LikedSongs  = require('../../database/schemas/LikedSongsSchema')

const DEFAULT_LOCALE = process.env.LANGUAGE || 'es-ES'
const VOTE_HOURS = 12

class MusicDatabase {
  constructor() {
    this._localeCache = new Map() // guildId -> locale
  }

  // ── Guild settings ─────────────────────────────────────────────────────────
  async _guild(guildId) {
    return MusicGuild.findOneAndUpdate({ id: guildId }, { $setOnInsert: { id: guildId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }).catch(() => null)
  }

  async getLocale(guildId) {
    if (this._localeCache.has(guildId)) return this._localeCache.get(guildId)
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    const loc = g?.locale || DEFAULT_LOCALE
    this._localeCache.set(guildId, loc)
    return loc
  }

  async setLocale(guildId, locale) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId }, { $set: { locale } }).catch(() => {})
    this._localeCache.set(guildId, locale)
  }

  async getPrefix(guildId) {
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    return g?.prefix || process.env.PREFIX || '!'
  }

  async setPrefix(guildId, prefix) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId }, { $set: { prefix } }).catch(() => {})
  }

  async deletePrefix(guildId) {
    await MusicGuild.updateOne({ id: guildId }, { $set: { prefix: null } }).catch(() => {})
  }

  // Ajustes del player (volumen por defecto, etc.)
  async getPlayer(guildId) {
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    return { defaultVolume: g?.defaultVolume ?? null }
  }

  async setDefaultVolume(guildId, vol) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId }, { $set: { defaultVolume: vol } }).catch(() => {})
  }

  // 24/7
  async get247Mode(guildId) {
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    if (!g) return { enabled: false, channelId: null, textId: null }
    return { enabled: !!g.enabled247, channelId: g.channel247Id, textId: g.text247Id }
  }

  async set247Mode(guildId, enabled, channelId = null, textId = null) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId },
      { $set: { enabled247: enabled, channel247Id: channelId, text247Id: textId } }).catch(() => {})
  }

  // Todos los guilds con 24/7 activo (para reconectar tras reinicio)
  async getAll247() {
    return MusicGuild.find({ enabled247: true, channel247Id: { $ne: null } })
      .select('id channel247Id text247Id').lean().catch(() => []) || []
  }

  async getVoiceStatus(guildId) {
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    return g?.voiceStatus ?? true
  }

  async setVoiceStatus(guildId, status) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId }, { $set: { voiceStatus: status } }).catch(() => {})
  }

  // ── Setup (canal de peticiones) ──────────────────────────────────────────────
  async getSetup(guildId) {
    const g = await MusicGuild.findOne({ id: guildId }).lean().catch(() => null)
    if (!g?.setupChannelId) return null
    return { channelId: g.setupChannelId, messageId: g.setupTextId }
  }

  async createSetup(guildId, channelId, messageId) {
    await this._guild(guildId)
    await MusicGuild.updateOne({ id: guildId },
      { $set: { setupChannelId: channelId, setupTextId: messageId } }).catch(() => {})
    return { channelId, messageId }
  }

  async deleteSetup(guildId) {
    await MusicGuild.updateOne({ id: guildId },
      { $set: { setupChannelId: null, setupTextId: null } }).catch(() => {})
  }

  // ── Estadísticas ─────────────────────────────────────────────────────────────
  async updateTrackStats(userId, guildId, track) {
    const info = track?.info || track || {}
    const trackId = track?.encoded || info.identifier || info.uri
    if (!trackId) return
    await TrackStats.findOneAndUpdate(
      { guildId, trackId, userId },
      {
        $inc: { playCount: 1 },
        $set: {
          title: info.title || '', author: info.author || '', uri: info.uri || '',
          artwork: info.artworkUrl || info.thumbnail || null, length: info.length || info.duration || 0,
          isStream: !!info.isStream, lastPlayed: new Date(),
        },
      },
      { upsert: true, new: true },
    ).catch(() => {})
  }

  async updateUserStats(userId, guildId) {
    await UserStats.findOneAndUpdate(
      { userId, guildId },
      { $inc: { playCount: 1 }, $set: { lastPlayed: new Date() } },
      { upsert: true, new: true },
    ).catch(() => {})
  }

  async getTopUsers(guildId, limit = 10) {
    return UserStats.find({ guildId }).sort({ playCount: -1 }).limit(limit).lean().catch(() => [])
  }

  async getTopGuilds(limit = 10) {
    return UserStats.aggregate([
      { $group: { _id: '$guildId', playCount: { $sum: '$playCount' } } },
      { $sort: { playCount: -1 } }, { $limit: limit },
    ]).catch(() => [])
  }

  async getTopTracks(guildId, limit = 10) {
    return TrackStats.aggregate([
      { $match: { guildId } },
      { $group: { _id: '$trackId', title: { $first: '$title' }, author: { $first: '$author' },
                  uri: { $first: '$uri' }, artwork: { $first: '$artwork' },
                  playCount: { $sum: '$playCount' } } },
      { $sort: { playCount: -1 } }, { $limit: limit },
    ]).catch(() => [])
  }

  async getRecentlyPlayed(userId, limit = 10) {
    return TrackStats.find({ userId }).sort({ lastPlayed: -1 }).limit(limit).lean().catch(() => [])
  }

  async clearRecentlyPlayed(userId) {
    await TrackStats.deleteMany({ userId }).catch(() => {})
  }

  // ── Playlists ────────────────────────────────────────────────────────────────
  async getPlaylist(userId, name) {
    return Playlist.findOne({ userId, name }).lean().catch(() => null)
  }

  async getPlaylistById(playlistId) {
    return Playlist.findById(playlistId).lean().catch(() => null)
  }

  async getPlaylists(userId) {
    return Playlist.find({ userId }).lean().catch(() => [])
  }

  async createPlaylist(userId, name) {
    try { await Playlist.create({ userId, name, tracks: [] }); return true }
    catch { return false } // índice único → ya existe
  }

  async deletePlaylist(userId, id) {
    const r = await Playlist.deleteOne({ _id: id, userId }).catch(() => ({ deletedCount: 0 }))
    return r.deletedCount > 0
  }

  async addTracksToPlaylist(playlistId, tracks) {
    const docs = (Array.isArray(tracks) ? tracks : [tracks]).map(t => ({
      url: t.url || t.uri || (t.info?.uri) || '', info: t.info || t || null,
    })).filter(t => t.url)
    await Playlist.updateOne({ _id: playlistId }, { $push: { tracks: { $each: docs } } }).catch(() => {})
    return docs.length
  }

  async removeSong(playlistId, trackId) {
    await Playlist.updateOne({ _id: playlistId },
      { $pull: { tracks: { _id: trackId } } }).catch(() => {})
  }

  async getTracksFromPlaylist(playlistId) {
    const p = await Playlist.findById(playlistId).lean().catch(() => null)
    return p?.tracks || []
  }

  // ── Liked songs (reusa LikedSongsSchema de OBEY) ───────────────────────────────
  async addToLikedSongs(userId, trackId, title, author, uri, artwork, length, isStream) {
    try {
      await LikedSongs.create({ userId, trackId, title, author, uri,
        artworkUrl: artwork || null, length: length || 0, isStream: !!isStream })
      return true
    } catch { return false } // ya existe
  }

  async removeFromLikedSongs(userId, trackId) {
    const r = await LikedSongs.deleteOne({ userId, trackId }).catch(() => ({ deletedCount: 0 }))
    return r.deletedCount > 0
  }

  async isTrackLiked(userId, trackId) {
    return !!(await LikedSongs.exists({ userId, trackId }).catch(() => false))
  }

  async getLikedSongs(userId, limit = 0) {
    const q = LikedSongs.find({ userId }).sort({ likedAt: -1 })
    if (limit) q.limit(limit)
    const rows = await q.lean().catch(() => [])
    // normalizar nombre de campo artwork para el código portado de Soundy
    return rows.map(r => ({ ...r, artwork: r.artworkUrl }))
  }

  async getLikedSongsCount(userId) {
    return LikedSongs.countDocuments({ userId }).catch(() => 0)
  }

  // ── Votos / Premium (UserVote type: vote|premium|regular) ──────────────────────
  async addUserVote(userId) {
    const expiresAt = new Date(Date.now() + VOTE_HOURS * 3600e3)
    await UserVote.create({ userId, type: 'vote', expiresAt }).catch(() => {})
  }

  async addPremium(userId, days = 30) {
    const expiresAt = new Date(Date.now() + days * 86400e3)
    await UserVote.create({ userId, type: 'premium', expiresAt }).catch(() => {})
  }

  async addRegularPremium(userId, days = 30) {
    const expiresAt = new Date(Date.now() + days * 86400e3)
    await UserVote.create({ userId, type: 'regular', expiresAt }).catch(() => {})
  }

  async hasActivePremium(userId) {
    return !!(await UserVote.exists({ userId, type: { $in: ['premium', 'regular'] },
      expiresAt: { $gt: new Date() } }).catch(() => false))
  }

  async getPremiumStatus(userId) {
    const doc = await UserVote.findOne({ userId, type: { $in: ['premium', 'regular'] },
      expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 }).lean().catch(() => null)
    return { isPremium: !!doc, expiresAt: doc?.expiresAt || null, type: doc?.type || null }
  }

  async getPremiumTimeRemaining(userId) {
    const doc = await UserVote.findOne({ userId, type: { $in: ['premium', 'regular'] },
      expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 }).lean().catch(() => null)
    return doc ? doc.expiresAt.getTime() - Date.now() : null
  }

  async cleanupExpiredVotes() {
    await UserVote.deleteMany({ expiresAt: { $lt: new Date() } }).catch(() => {})
  }

  async clearVoteData(userId) { await UserVote.deleteMany({ userId, type: 'vote' }).catch(() => {}) }
  async clearPlaylistData(userId) { await Playlist.deleteMany({ userId }).catch(() => {}) }
  async clearPremiumData(userId) { await UserVote.deleteMany({ userId, type: { $in: ['premium', 'regular'] } }).catch(() => {}) }
  async clearStatsData() { await Promise.all([TrackStats.deleteMany({}), UserStats.deleteMany({})]).catch(() => {}) }

  async clearAllData(userId) {
    if (userId) {
      await Promise.all([
        UserVote.deleteMany({ userId }), Playlist.deleteMany({ userId }),
        LikedSongs.deleteMany({ userId }), TrackStats.deleteMany({ userId }), UserStats.deleteMany({ userId }),
      ]).catch(() => {})
    }
  }

  // ── Stats agregadas ────────────────────────────────────────────────────────────
  async getVoteStats(userId) {
    const f = userId ? { userId, type: 'vote' } : { type: 'vote' }
    return { count: await UserVote.countDocuments(f).catch(() => 0) }
  }

  async getPlaylistStats(userId) {
    const f = userId ? { userId } : {}
    return { count: await Playlist.countDocuments(f).catch(() => 0) }
  }

  async getPremiumStats(userId) {
    const f = { type: { $in: ['premium', 'regular'] }, expiresAt: { $gt: new Date() } }
    if (userId) f.userId = userId
    return { count: await UserVote.countDocuments(f).catch(() => 0) }
  }

  async getGeneralStats() {
    const [guilds, playlists, liked, tracks] = await Promise.all([
      MusicGuild.countDocuments({}), Playlist.countDocuments({}),
      LikedSongs.countDocuments({}), TrackStats.countDocuments({}),
    ]).catch(() => [0, 0, 0, 0])
    return { guilds, playlists, liked, tracks }
  }

  // ── Infra ──────────────────────────────────────────────────────────────────────
  async testConnections() { return { mongo: true } }
  async sync() { return true }
  async getPerformanceStats() { return { cacheSize: this._localeCache.size } }
  isReady() { return true }
  clearCache(guildId) { this._localeCache.delete(guildId) }
  clearAllCache() { this._localeCache.clear() }
}

module.exports = { MusicDatabase, database: new MusicDatabase() }
