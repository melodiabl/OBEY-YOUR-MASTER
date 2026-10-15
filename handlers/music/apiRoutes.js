// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Endpoints REST de Soundy (port de src/api/*) montados en el dashboard
// Express EXISTENTE de OBEY (sin servidor extra, sin choque de puerto).
// Rutas: /api/music/*, /api/top/*, /api/playlist/*
// SEGURIDAD: las rutas con datos personales exigen sesión OAuth del dashboard y
// derivan el userId de la sesión (nunca del body/params) → evita IDOR.
// Debe montarse DESPUÉS del middleware de sesión.
// ─────────────────────────────────────────────────────────────────────────────
const { database } = require('./database')
const validURL = value => typeof value === 'string' && value.length <= 2048 && (() => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password } catch { return false } })()

module.exports = (app, client, {
  canManageGuild = () => false,
  requireAuth = (req, res) => res.status(401).json({ error: 'not_authenticated' }),
  requireFreshGuildPermissions = (req, res) => res.status(503).json({ error: 'permissions_unavailable' }),
  database: repository = database,
  getCurrentLyrics = require('./web-lyrics').getCurrentLyrics,
} = {}) => {
  const music = () => client.music
  const ok  = (res, data) => res.json({ success: true, data })
  const bad = (res, code, msg) => res.status(code).json({ success: false, error: msg })
  const wrap = fn => (req, res) => Promise.resolve(fn(req, res)).catch(() => bad(res, 500, 'internal_error'))

  // Requiere sesión del dashboard (OAuth Discord). Devuelve 401 JSON si no.
  const apiAuth = requireAuth
  const uid = req => req.session.user.id
  const guildAccess = (req, res, next) => {
    const guildId = req.params.guildId || req.query.guildId
    if (typeof guildId !== 'string' || !guildId) return bad(res, 400, 'missing_or_invalid_guild')
    if (!client.guilds.cache.has(guildId) || !canManageGuild(req.session.user, guildId)) return bad(res, 403, 'no_permission')
    res.set('Cache-Control', 'private, no-store')
    return next()
  }

  // ── Público (sin datos personales) ───────────────────────────────────────────
  app.get('/api/music/health', (req, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }))

  app.get('/api/music/status/:guildId', apiAuth, requireFreshGuildPermissions, guildAccess, (req, res) => {
    if (!canManageGuild(req.session.user, req.params.guildId)) return bad(res, 403, 'no_permission')
    ok(res, music()?.getPublicState?.(req.params.guildId) || { active: false })
  })

  app.get('/api/music/lyrics/:guildId', apiAuth, requireFreshGuildPermissions, guildAccess,
    wrap(async (req, res) => ok(res, await getCurrentLyrics(music(), req.params.guildId))))

  app.get('/api/music/search', wrap(async (req, res) => {
    const q = req.query.q
    if (!q) return bad(res, 400, 'missing q')
    const r = await music().search(String(q), 'WebAPI')
    ok(res, (r?.tracks || []).map(t => require('./utils').normalizePublicTrack(t)))
  }))

  app.get('/api/top/tracks', apiAuth, requireFreshGuildPermissions, guildAccess,
    wrap(async (req, res) => ok(res, await repository.getTopTracks(req.query.guildId, Math.max(1, Math.min(100, Number(req.query.limit) || 10))))))
  app.get('/api/top/users', apiAuth, requireFreshGuildPermissions, guildAccess,
    wrap(async (req, res) => ok(res, await repository.getTopUsers(req.query.guildId, Math.max(1, Math.min(100, Number(req.query.limit) || 10))))))
  app.get('/api/top/guilds', apiAuth, requireFreshGuildPermissions, wrap(async (req, res) => {
    res.set('Cache-Control', 'private, no-store')
    const guildIds = (req.session.user.guilds || []).filter(guild => client.guilds.cache.has(guild.id)
      && canManageGuild(req.session.user, guild.id)).map(guild => guild.id)
    ok(res, await repository.getTopGuilds(Math.max(1, Math.min(100, Number(req.query.limit) || 10)), guildIds))
  }))

  // ── Privado (userId SIEMPRE de la sesión) ────────────────────────────────────
  app.get('/api/music/liked', apiAuth, wrap(async (req, res) => {
    res.set('Cache-Control', 'private, no-store')
    ok(res, await repository.getLikedSongs(uid(req)))
  }))
  app.get('/api/music/recent', apiAuth, wrap(async (req, res) => ok(res, await database.getRecentlyPlayed(uid(req), Math.max(1, Math.min(100, Number(req.query.limit) || 20))))))

  app.post('/api/music/like', apiAuth, wrap(async (req, res) => {
    const userId = uid(req)                       // ← de la sesión, NO del body
    const { trackId, title, author, uri, artwork, length, isStream, sourceName, liked } = req.body || {}
    if (typeof trackId !== 'string' || !trackId || trackId.length > 8192 ||
        [title, author, sourceName].some(v => v !== undefined && (typeof v !== 'string' || v.length > 256)) ||
        liked !== undefined && typeof liked !== 'boolean' ||
        length !== undefined && (!Number.isFinite(length) || length < 0) ||
        isStream !== undefined && typeof isStream !== 'boolean') return bad(res, 400, 'invalid_track')
    if (uri !== undefined && !validURL(uri) || artwork != null && !validURL(artwork) || liked === true && !uri) return bad(res, 400, 'invalid_track')
    const track = { trackId, info: { title, author, uri, artworkUrl: artwork, length, isStream, sourceName } }
    if (uri && !require('./nodes-config').allowedMusicTrack(track)) return bad(res, 400, 'source_not_allowed')
    const result = await repository.setLikedSong(userId, track, liked)
    if (!result) return bad(res, 400, 'invalid_track')
    ok(res, { liked: result.liked })
  }))

  app.post('/api/music/liked/play/:guildId', apiAuth, requireFreshGuildPermissions, guildAccess, wrap(async (req, res) => {
    const guildId = req.params.guildId, guild = client.guilds.cache.get(guildId), player = music()
    if (!player) return bad(res, 503, 'no_music')
    const requested = req.body?.voiceChannelId
    if (requested !== undefined && (typeof requested !== 'string' || guild.channels.cache.get(requested)?.type !== 2)) return bad(res, 400, 'invalid_voice_channel')
    const voiceId = requested || player.getState(guildId)?.voiceChannelId
    if (!voiceId) return bad(res, 400, 'no_voice_channel')
    const songs = await repository.getLikedSongs(uid(req))
    const tracks = songs.filter(song => validURL(song.uri)).map(song => ({
      info: { title: song.title, author: song.author, uri: song.uri, artworkUrl: song.artworkUrl || song.artwork,
        length: song.length, isStream: song.isStream, sourceName: song.sourceName || '' },
    })).filter(require('./nodes-config').allowedMusicTrack)
    if (!tracks.length) return bad(res, 400, 'empty_collection')
    const added = await player.playCollection(guildId, voiceId, player.getState(guildId)?.textChannelId || guild.systemChannelId || '',
      tracks, { id: uid(req), username: req.session.user.username })
    ok(res, { added })
  }))

  // ── Playlist (privado, con verificación de propiedad) ────────────────────────
  app.get('/api/playlist/list', apiAuth, wrap(async (req, res) => ok(res, await database.getPlaylists(uid(req)))))

  app.get('/api/playlist/view/:playlistId', apiAuth, wrap(async (req, res) => {
    const p = await database.getPlaylistById(req.params.playlistId)
    if (!p) return bad(res, 404, 'not found')
    if (p.userId !== uid(req)) return bad(res, 403, 'forbidden')
    ok(res, p)
  }))

  app.post('/api/playlist/create', apiAuth, wrap(async (req, res) => {
    const { name } = req.body || {}
    if (!name) return bad(res, 400, 'missing name')
    ok(res, { created: await database.createPlaylist(uid(req), name) })
  }))

  // Verifica que la playlist pertenezca al usuario de la sesión antes de modificar
  const ownPlaylist = async (req, res) => {
    const id = req.body?.playlistId
    if (!id) { bad(res, 400, 'missing playlistId'); return null }
    const p = await database.getPlaylistById(id)
    if (!p) { bad(res, 404, 'not found'); return null }
    if (p.userId !== uid(req)) { bad(res, 403, 'forbidden'); return null }
    return p
  }

  app.post('/api/playlist/add', apiAuth, wrap(async (req, res) => {
    if (!(await ownPlaylist(req, res))) return
    ok(res, { added: await database.addTracksToPlaylist(req.body.playlistId, req.body.tracks) })
  }))

  app.post('/api/playlist/remove', apiAuth, wrap(async (req, res) => {
    if (!(await ownPlaylist(req, res))) return
    await database.removeSong(req.body.playlistId, req.body.trackId)
    ok(res, { removed: true })
  }))

  app.post('/api/playlist/delete', apiAuth, wrap(async (req, res) => {
    const { id } = req.body || {}
    if (!id) return bad(res, 400, 'missing id')
    ok(res, { deleted: await database.deletePlaylist(uid(req), id) }) // deletePlaylist filtra por userId
  }))

  console.log('[Music] Endpoints API montados en el dashboard (/api/music, /api/top, /api/playlist)')
}
