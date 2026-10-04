const { test } = require('node:test')
const assert = require('node:assert/strict')
const { sessionAuth, establishSession } = require('../dashboard/auth')
function response() {
  return { status(code) { this.code = code; return this }, json(body) { this.body = body }, redirect(url) { this.url = url } }
}

test('API authentication denies missing and malformed sessions as JSON', async () => {
  for (const user of [undefined, { id: 'u' }, { id: 'u', expires_at: 'invalid' }]) {
    const res = response()
    await sessionAuth(async () => assert.fail())({ path: '/api/music/liked', session: { user } }, res, assert.fail)
    assert.equal(res.code, 401)
    assert.equal(res.body.error, 'not_authenticated')
  }
})

test('web redirects while expired API sessions refresh before proceeding', async () => {
  const res = response()
  await sessionAuth(async () => {})({ path: '/dashboard', session: {} }, res, assert.fail)
  assert.equal(res.url, '/login?reason=not_logged_in')
  const req = { path: '/api/music/liked', session: { user: { id: 'u', expires_at: 1 } } }
  let next = false
  await sessionAuth(async session => { session.user.expires_at = Date.now() + 7200000 })(req, response(), () => { next = true })
  assert.equal(next, true)
})

test('failed refresh destroys the session and never authorizes the request', async () => {
  let destroyed = false
  const req = { path: '/api/music/liked', session: { user: { id: 'u', expires_at: 1 }, destroy(cb) { destroyed = true; cb() } } }
  const res = response()
  await sessionAuth(async () => { throw new Error('secret provider error') })(req, res, assert.fail)
  assert.equal(destroyed, true)
  assert.equal(res.code, 401)
  assert.equal(res.body.error, 'session_expired')
})

test('OAuth login rotates the session and saves identity before redirect can occur', async () => {
  const req = { session: { oauthState: 'old', csrfToken: 'old', regenerate(cb) {
    req.session = { save(done) { done() } }; cb()
  } } }
  await establishSession(req, { id: 'new-user' })
  assert.equal(req.session.user.id, 'new-user')
  assert.equal(req.session.oauthState, undefined)
  assert.equal(req.session.csrfToken, undefined)
})

test('OAuth rotation and storage failures are propagated', async () => {
  const req = { session: { regenerate(cb) { cb(new Error('rotation failed')) } } }
  await assert.rejects(establishSession(req, { id: 'u' }), /rotation failed/)
  const storage = { session: { regenerate(cb) {
    storage.session = { save(done) { done(new Error('storage failed')) } }; cb()
  } } }
  await assert.rejects(establishSession(storage, { id: 'u' }), /storage failed/)
})
