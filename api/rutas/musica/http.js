// HTTP adapter. Session and fresh-permission middleware remain at registration.
module.exports = ({ client, canManageGuild }) => async (req, res) => {
    const guildId   = req.params.guildId
    if (!canManageGuild(req.session.user, guildId))
      return res.json({ results: [], error: 'no_permission' })
    const { query, kind = 'all', source = 'auto' } = req.body
    if (!query) return res.json({ results: [] })
    const music = client.music
    if (!music) return res.json({ results: [] })
    try {
      if (typeof query !== 'string' || query.length > 2000) return res.status(400).json({ results: [], error: 'invalid_query' })
      const { normalizePublicTrack } = require('../../../handlers/music/utils')
      if (kind === 'artist') {
        const profile = await require('../../../handlers/music/artists').getArtist(client, query, { guildId })
        return res.json({ ...profile, tracks: profile.tracks.map(t => normalizePublicTrack(t)) })
      }
      const { searchCatalog } = require("../../../bot/modulos/musica/servicios/catalogo")
      const result = await searchCatalog(client, query, { guildId, limit: 50, kind, source })
      const tracks = result.tracks.map(t => normalizePublicTrack(t))
      res.json({ results: tracks, tracks, albums: result.albums, artists: result.artists, preferredTab: result.preferredTab, statuses: result.statuses, sources: result.sources, source: result.source, kind: result.kind, query: result.query })
    } catch (e) {
      res.status(['invalid_artist', 'invalid_search_options'].includes(e.code) ? 400 : e.code === 'music_search_busy' ? 429 : 503).json({ results: [], tracks: [], albums: [], artists: [], error: e.code === 'invalid_search_options' ? 'invalid_search_options' : e.code === 'music_search_busy' ? 'search_busy' : 'search_unavailable' })
    }
}
