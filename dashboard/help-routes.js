const { HelpError } = require('../handlers/help')
module.exports = (app, client, { requireAuth, requireFreshGuildPermissions, canManageGuild }) => {
  const access = (req, res, next) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild) return res.status(404).json({ error: 'help_not_found' })
    if (!canManageGuild(req.session.user, guild.id)) return res.status(403).json({ error: 'no_permission' })
    if (!client.helpService) return res.status(503).json({ error: 'help_unavailable' })
    req.helpGuild = guild
    res.set('Cache-Control', 'private, no-store')
    return next()
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  const wrap = handler => async (req, res) => {
    try { return await handler(req, res) }
    catch (error) {
      const code = error instanceof HelpError ? error.code : 'help_unavailable'
      return res.status(code === 'invalid_help' ? 400 : code === 'help_not_found' ? 404 : 503).json({ error: code })
    }
  }
  app.get('/help/:guildId', ...guarded, (req, res) => res.render('pages/help', { user: req.session.user, guild: { id: req.helpGuild.id, name: req.helpGuild.name } }))
  app.get('/api/help/:guildId/channels', ...guarded, wrap(async (req, res) => {
    const guild = req.helpGuild
    const [channels, member] = await Promise.all([guild.channels.fetch(), guild.members.fetch({ user: req.session.user.id, force: true })])
    res.json({ channels: [...channels.values()].filter(channel => channel.isTextBased?.() && channel.permissionsFor(member)?.has('ViewChannel')).map(({ id, name }) => ({ id, name })) })
  }))
  app.get('/api/help/:guildId', ...guarded, wrap(async (req, res) => {
    const query = req.query || {}
    if (Object.keys(query).some(key => !['search', 'category', 'channelId', 'command', 'page'].includes(key)) ||
      Object.values(query).some(value => typeof value !== 'string' || value.length > 100) || query.page !== undefined && !/^\d{1,4}$/.test(query.page)) throw new HelpError('invalid_help')
    const view = await client.helpService.read({ guildId: req.helpGuild.id, actorId: req.session.user.id, channelId: query.channelId || undefined, query: query.command || '' })
    const search = (query.search || '').toLowerCase()
    const entries = view.commands.filter(entry => (!query.category || entry.category === query.category) &&
      (!search || [entry.invocation, entry.name, entry.description, ...entry.aliases].some(value => value.toLowerCase().includes(search))))
    const pages = Math.max(1, Math.ceil(entries.length / 25)), page = Math.min(Number(query.page || 0), pages - 1)
    res.json({ guildId: view.guildId, prefix: view.prefix, categories: view.categories, counts: view.counts, detail: view.detail,
      commands: entries.slice(page * 25, (page + 1) * 25), total: entries.length, pages, page })
  }))
}
