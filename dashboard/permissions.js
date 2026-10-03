function freshGuildPermissions(fetchGuilds) {
  return async (req, res, next) => {
    try {
      const guilds = await fetchGuilds(req.session.user.access_token)
      if (!Array.isArray(guilds)) throw new Error('Invalid guild list')
      req.session.user = {
        ...req.session.user,
        guilds,
        guilds_fetched_at: Date.now(),
      }
      next()
    } catch {
      res.status(503).json({ error: 'No se pudieron verificar los permisos de Discord' })
    }
  }
}

module.exports = { freshGuildPermissions }
