const { test } = require('node:test')
const assert = require('node:assert/strict')
const { csrfProtection } = require('../dashboard/security')
function request(method, token, origin) {
  return { method, session: { user: { id: 'one' }, csrfToken: 'a'.repeat(64) }, body: {}, get: header => header === 'origin' ? origin : header === 'x-csrf-token' ? token : undefined }
}
function response() { return { locals: {}, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } } }
test('CSRF accepts the session token and rejects missing or foreign tokens', () => {
  const protect = csrfProtection('https://obey.example'), good = request('POST', 'a'.repeat(64), 'https://obey.example')
  let continued = false
  protect(good, response(), () => { continued = true })
  assert.equal(continued, true)
  for (const req of [request('POST', undefined), request('POST', 'a'.repeat(64), 'https://evil.example'), request('POST', 'é'.repeat(64))]) {
    const res = response()
    protect(req, res, assert.fail)
    assert.equal(res.code, 403)
  }
})
test('read requests make the CSRF token available to page templates', () => {
  const req = request('GET'), res = response()
  csrfProtection('https://obey.example')(req, res, () => {})
  assert.equal(res.locals.csrfToken, req.session.csrfToken)
})
