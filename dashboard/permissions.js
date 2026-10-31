const { reloadSession, saveSession, invalidateSession } = require('./auth')
const { stamp } = require('./session-store')
const fail = code => { throw Object.assign(new Error(code), { code }) }
function sanitizeGuilds(guilds) {
  if (!Array.isArray(guilds) || guilds.length > 2000) fail('permissions_unavailable')
  const seen = new Set()
  return guilds.map(guild => {
    const permissions = guild?.permissions ?? '0'
    if (typeof guild?.id !== 'string' || !/^\d{17,20}$/.test(guild.id) || seen.has(guild.id) ||
      typeof permissions !== 'string' || !/^\d{1,24}$/.test(permissions) ||
      guild.owner !== undefined && typeof guild.owner !== 'boolean') fail('permissions_unavailable')
    seen.add(guild.id)
    return { id: guild.id, name: String(guild.name || 'Servidor').slice(0, 100), owner: guild.owner === true, permissions,
      icon: typeof guild.icon === 'string' && /^(?:a_)?[a-f0-9]{32}$/.test(guild.icon) ? guild.icon : null }
  })
}
async function readFreshGuilds(req, fetchGuilds) {
  const before = { authVersion: req.session?.authVersion, user: { ...req.session?.user } }
  let guilds
  try { guilds = sanitizeGuilds(await fetchGuilds(before.user.access_token)) }
  catch (error) {
    await reloadSession(req)
    if (stamp(req.session) !== stamp(before)) fail('not_authenticated')
    if (error?.response?.status === 401) { await invalidateSession(req); fail('not_authenticated') }
    fail('permissions_unavailable')
  }
  await reloadSession(req)
  if (stamp(req.session) !== stamp(before) || req.session.user.expires_at <= Date.now()) fail('not_authenticated')
  req.session.user = { ...req.session.user, guilds, guilds_fetched_at: Date.now() }
  await saveSession(req)
  return req.session.user
}
function freshGuildPermissions(fetchGuilds) {
  return async (req, res, next) => {
    try { await readFreshGuilds(req, fetchGuilds); return next() }
    catch (error) {
      const unauthenticated = error?.code === 'not_authenticated'
      res.status(unauthenticated ? 401 : 503)
      if (req.path?.startsWith('/api/')) return res.json({ error: unauthenticated ? 'not_authenticated' : 'permissions_unavailable' })
      return res.send(unauthenticated ? 'Tu sesión ya no está disponible. <a href="/login">Iniciar sesión</a>.'
        : 'No se pudieron verificar tus permisos en Discord. <a href="/dashboard">Volver a intentarlo</a>.')
    }
  }
}
module.exports = { freshGuildPermissions, readFreshGuilds, sanitizeGuilds }
