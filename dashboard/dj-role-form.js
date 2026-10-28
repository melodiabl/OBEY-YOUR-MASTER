const { replaceDjRoles } = require('../handlers/dj-role-settings')
async function saveDjRoleForm(client, req, res, guild) {
  const body = req.body || {}
  if (Object.keys(body).some(key => !['_intent', 'djRoles', 'djRolesRevision', '_csrf'].includes(key)))
    return res.status(400).json({ error: 'invalid_setup' })
  const roles = body.djRoles === undefined ? [] : typeof body.djRoles === 'string' ? [body.djRoles] : body.djRoles
  try {
    await replaceDjRoles(client, { guildId: guild.id, actorId: req.session.user.id, transport: 'web' }, roles, body.djRolesRevision)
    return res.redirect(303, `/dashboard/${guild.id}?djRolesSaved=1&tab=music`)
  } catch (error) {
    const codes = { invalid_setup: 400, invalid_dj_role: 400, setup_denied: 403, setup_conflict: 409, setup_unavailable: 503, setup_storage: 503 }
    const code = Object.hasOwn(codes, error.code) ? error.code : 'setup_storage'
    return res.status(codes[code]).json({ error: code,
      message: code === 'setup_conflict' ? 'Los roles DJ cambiaron. Actualiza la página y revisa la selección antes de guardar.' : 'No se pudo guardar la selección de roles DJ. Revisa tus permisos y vuelve a abrir la configuración.' })
  }
}
module.exports = { saveDjRoleForm }
