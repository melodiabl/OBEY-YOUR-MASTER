const { randomBytes, timingSafeEqual } = require('node:crypto')
function csrfProtection(baseUrl) {
  const allowedOrigin = new URL(baseUrl).origin
  return (req, res, next) => {
    if (!req.session?.user) return next()
    req.session.csrfToken ||= randomBytes(32).toString('hex')
    res.locals.csrfToken = req.session.csrfToken
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
    const origin = req.get('origin')
    const token = req.get('x-csrf-token') || req.body?._csrf || ''
    const expected = req.session.csrfToken
    if ((origin && origin !== allowedOrigin) || typeof token !== 'string' || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return res.status(403).json({ ok: false, error: 'csrf_invalid' })
    }
    return next()
  }
}
module.exports = { csrfProtection }
