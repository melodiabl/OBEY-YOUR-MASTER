module.exports = (app, client, { canManageGuild, requireAuth, requireFreshGuildPermissions }) => {
  app.get('/api/nowplaying', (req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    // Preserve the landing's response contract without publishing private guild data.
    if (!req.session?.user) return res.json({ tracks: [] })
    return requireAuth(req, res, next)
  }, requireFreshGuildPermissions, (req, res) => {
    const tracks = []
    for (const [guildId, state] of client.music?.playerStates || []) {
      if (!canManageGuild(req.session.user, guildId)) continue
      const track = state?.currentTrack
      const guild = client.guilds.cache.get(guildId)
      if (!track || !guild) continue
      const info = track.info || track
      tracks.push({ guildId, guildName: guild.name, trackTitle: info.title || '?',
        trackAuthor: info.author || '', uri: info.uri || null,
        thumbnail: require('../handlers/music/utils').trackArtwork(track) })
    }
    res.json({ tracks })
  })
}
