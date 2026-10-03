const assert = require('node:assert/strict')
const test = require('node:test')
const { freshGuildPermissions } = require('../dashboard/permissions')

test('refreshes Discord guild permissions before continuing a settings write', async () => {
  const req = { session: { user: { access_token: 'token', guilds: [{ id: 'old' }] } } }
  let continued = false
  const middleware = freshGuildPermissions(async token => {
    assert.equal(token, 'token')
    return [{ id: 'current', permissions: '0' }]
  })

  await middleware(req, null, () => { continued = true })
  assert.equal(continued, true)
  assert.deepEqual(req.session.user.guilds, [{ id: 'current', permissions: '0' }])
})

test('denies a settings write when current permissions cannot be checked', async () => {
  const req = { session: { user: { access_token: 'token', guilds: [{ id: 'old' }] } } }
  let status
  let continued = false
  const res = {
    status: code => { status = code; return res },
    json: () => res,
  }

  await freshGuildPermissions(async () => { throw new Error('Discord unavailable') })(
    req, res, () => { continued = true },
  )
  assert.equal(status, 503)
  assert.equal(continued, false)
})
