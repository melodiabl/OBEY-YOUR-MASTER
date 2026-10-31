const { timingSafeEqual } = require('node:crypto')
function csrfProtection(baseUrl) {
  const allowedOrigin = new URL(baseUrl).origin
  return (req, res, next) => {
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    const origin = req.get('origin')
    if (!safeMethod && origin && origin !== allowedOrigin) return res.status(403).json({ ok: false, error: 'csrf_invalid' })
    if (!req.session?.user) return next()
    res.locals.csrfToken = req.session.csrfToken || ''
    if (safeMethod) return next()
    const token = req.get('x-csrf-token') || req.body?._csrf || ''
    const expected = req.session.csrfToken
    if ((origin && origin !== allowedOrigin) || typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected) || typeof token !== 'string' || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return res.set('Cache-Control', 'private, no-store').vary('Cookie').status(403).json({ ok: false, error: 'csrf_invalid' })
    }
    return next()
  }
}
module.exports = { csrfProtection }
