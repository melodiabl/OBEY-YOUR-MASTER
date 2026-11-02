// Ejemplo de router de intención, NO conectado al proyecto. No habilita escrituras.
// Express debe recibir autorización de sesión, permisos frescos, CSRF y revisión.
const { Router } = require('express')

function rutasBuilder({ permisos, servicio, csrf }) {
  const router = Router({ mergeParams: true })
  router.post('/simular', csrf, async (req, res, next) => {
    try {
      const { id } = req.params
      await permisos.exigirGestion(req.session.user.id, id)
      const vista = await servicio.simular(id, req.session.user.id, req.body)
      return res.json({ ok: true, vista })
    } catch (error) { return next(error) }
  })
  // ¡Importante! /aplicar requiere confirmación, revisión, idempotencia y respaldo;
  // no se crea un endpoint ejecutor incompleto en el material de planificación.
  return router
}
module.exports = { rutasBuilder }
