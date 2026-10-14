module.exports = (app, client, { canManageGuild, requireAuth, requireFreshGuildPermissions }) => {
  function access(req, res, next) {
    res.set('Cache-Control', 'private, no-store')
    if (!client.guilds.cache.has(req.params.guildId)) return res.status(404).json({ error: 'guild_not_found' })
    if (!canManageGuild(req.session.user, req.params.guildId)) return res.status(403).json({ error: 'no_permission' })
    if (!client.music?.getNodes) return res.status(503).json({ error: 'nodes_unavailable' })
    next()
  }
  app.get('/nodes/:guildId', requireAuth, requireFreshGuildPermissions, access, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    res.render('pages/nodes', { user: req.session.user, guild: { id: guild.id, name: guild.name } })
  })
  app.get('/api/player/:guildId/nodes', requireAuth, requireFreshGuildPermissions, access, (req, res) => res.json(client.music.getNodes(req.params.guildId)))
  app.post('/api/player/:guildId/nodes', requireAuth, requireFreshGuildPermissions, access, async (req, res) => {
    if (!req.body || typeof req.body.nodeId !== 'string' || Object.keys(req.body).some(key => !['nodeId', '_csrf'].includes(key))) return res.status(400).json({ error: 'invalid_node_selection' })
    try { res.json(await client.music.setNodePreference(req.params.guildId, req.body.nodeId)) }
    catch (error) {
      const known = ['node_not_available', 'node_unavailable', 'nodes_unavailable', 'node_change_failed']
      res.status(error.message === 'node_not_available' ? 400 : 503).json({ error: known.includes(error.message) ? error.message : 'node_change_failed' })
    }
  })
}
