const { saveMusicDefaults } = require('../handlers/music-default-settings')
async function saveMusicDefaultForm(client, req, res, guild) {
  const body = req.body || {}
  if (Object.keys(body).some(key => !['_intent', 'defaultVolume', 'autoplay', 'defaultEqualizer', 'musicDefaultsRevision', '_csrf'].includes(key)) ||
      typeof body.defaultVolume !== 'string' || !/^\d{1,3}$/.test(body.defaultVolume) ||
      body.autoplay !== undefined && body.autoplay !== 'on') return res.status(400).json({ error: 'invalid_setup' })
  try {
    await saveMusicDefaults(client, { guildId: guild.id, actorId: req.session.user.id, transport: 'web' },
      { volume: Number(body.defaultVolume), autoplay: body.autoplay === 'on', ...(Object.hasOwn(body, 'defaultEqualizer') ? { equalizer: body.defaultEqualizer } : {}) }, body.musicDefaultsRevision)
    return res.redirect(303, `/dashboard/${guild.id}?musicDefaultsSaved=1&tab=music`)
  } catch (error) {
    const codes = { invalid_setup: 400, setup_denied: 403, setup_conflict: 409, setup_unavailable: 503, setup_storage: 503 }
    const code = Object.hasOwn(codes, error.code) ? error.code : 'setup_storage'
    return res.status(codes[code]).json({ error: code, message: code === 'setup_conflict'
      ? 'Los ajustes de música cambiaron. Actualiza la página y revísalos antes de guardar.'
      : 'No se pudo guardar. Revisa tus permisos y vuelve a abrir la configuración de música.' })
  }
}
module.exports = { saveMusicDefaultForm }
