const test = require('node:test'), assert = require('node:assert/strict'), express = require('express')
const { canManageGuild } = require('../handlers/permissions')
const { csrfProtection } = require('../dashboard/security')
test('node API requires current guild access and CSRF, accepts IDs only and hides integration errors', async t => {
  const app = express(), writes = [], server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const origin = 'http://127.0.0.1:' + server.address().port
  app.use(express.json()); app.use((req, res, next) => {
    req.session = { user: req.get('x-user') === 'none' ? null : { guilds: [{ id: 'g', permissions: '32' }] }, csrfToken: 'token' }; next()
  }); app.use(csrfProtection(origin))
  const view = { preferenceId: 'auto', currentId: 'auto', nodes: [{ id: 'public-one', label: 'Music', status: 'online' }] }
  require('../dashboard/nodes-routes')(app, { guilds: { cache: new Map([['g', { id: 'g' }], ['foreign', {}]]) }, music: {
    getNodes: () => view,
    setNodePreference: async (guildId, nodeId) => { if (nodeId !== 'public-one') throw Error('private-secret http://127.0.0.1'); writes.push({ guildId, nodeId }); return view },
  } }, { canManageGuild, requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'login' }),
    requireFreshGuildPermissions: (req, res, next) => { if (req.get('x-revoked')) req.session.user.guilds = []; next() } })
  const request = (guildId = 'g', options = {}) => fetch(origin + '/api/player/' + guildId + '/nodes', options)
  const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': 'token' }, body: JSON.stringify(body) })
  assert.equal((await request('g', { headers: { 'x-user': 'none' } })).status, 401)
  assert.equal((await request('foreign')).status, 403)
  assert.equal((await request('missing')).status, 404)
  assert.equal((await request('g', { headers: { 'x-revoked': 'yes' } })).status, 403)
  assert.equal((await request()).headers.get('cache-control'), 'private, no-store')
  assert.equal((await request('g', { ...post({ nodeId: 'public-one' }), headers: { 'content-type': 'application/json' } })).status, 403)
  assert.equal((await request('g', post({ nodeId: 'public-one', host: 'attacker' }))).status, 400)
  assert.equal(writes.length, 0)
  const failed = await request('g', post({ nodeId: 'private-primary' })); assert.equal(failed.status, 503)
  assert.equal((await failed.json()).error, 'node_change_failed')
  assert.equal((await request('g', post({ nodeId: 'public-one' }))).status, 200)
  assert.deepEqual(writes, [{ guildId: 'g', nodeId: 'public-one' }])
})
test('SponsorBlock uses the selected node REST client and skips providers without the plugin', async () => {
  const { configureSponsorBlock } = require('../handlers/music/nodes-runtime'), calls = []
  const player = { guildId: 'guild', node: { name: 'public-one', sessionId: 'session', rest: { fetch: async options => calls.push(options) } } }
  await configureSponsorBlock(player, { supportsPlugin: () => false }); assert.equal(calls.length, 0)
  await configureSponsorBlock(player, { supportsPlugin: name => name === 'public-one' })
  assert.equal(calls[0].endpoint, '/sessions/session/players/guild/sponsorblock/categories')
  assert.equal(calls[0].options.method, 'PUT'); assert.ok(!JSON.stringify(calls).includes('Authorization'))
})
