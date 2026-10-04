const { test } = require('node:test')
const assert = require('node:assert/strict')
const { canManageGuild } = require('../handlers/permissions')
function fixture() {
  const routes = new Map(), calls = []
  const app = { get: (path, ...handlers) => routes.set(`GET ${path}`, handlers), post: (path, ...handlers) => routes.set(`POST ${path}`, handlers) }
  const jobs = { available: () => true, list: async (guild, actor) => { calls.push({ guild, actor }); return [] }, submit: async input => { calls.push(input); return { id: 'job', status: 'queued' } }, get: async () => null, cancel: async () => null }
  require('../dashboard/architect-routes')(app, { architect: {}, jobs, guilds: { cache: new Map([['g', { id: 'g' }]]) } }, {
    canManageGuild, requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({}), requireFreshGuildPermissions: (req, res, next) => next(),
  })
  async function request(method, suffix, user, body = {}, guildId = 'g') {
    const req = { params: { guildId, jobId: 'foreign' }, session: { user }, body }, res = { code: 200, set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body } }
    const handlers = routes.get(`${method} /api/architect/:guildId/jobs${suffix}`); let index = 0
    await (async function next() { if (handlers[index]) return handlers[index++](req, res, next) })()
    return res
  }
  return { request, calls }
}
const admin = { id: 'actor', guilds: [{ id: 'g', permissions: '32' }] }
test('job routes authorize before reads and take actor and guild only from the session', async () => {
  const f = fixture()
  assert.equal((await f.request('GET', '', null)).code, 401)
  assert.equal((await f.request('POST', '', { id: 'actor', guilds: [] })).code, 403)
  assert.equal((await f.request('GET', '', admin, {}, 'foreign')).code, 404)
  assert.deepEqual(f.calls, [])
  assert.equal((await f.request('POST', '', admin, { idempotencyKey: 'key', actorId: 'injected' })).code, 400)
  assert.equal((await f.request('POST', '', admin, { idempotencyKey: 'key' })).code, 202)
  assert.deepEqual(f.calls, [{ guildId: 'g', actorId: 'actor', type: 'architect.snapshot', idempotencyKey: 'key' }])
})
test('private jobs missing from actor scope do not expose another actor record', async () => {
  const f = fixture()
  assert.equal((await f.request('GET', '/:jobId', admin)).code, 404)
  assert.equal((await f.request('POST', '/:jobId/cancel', admin)).code, 404)
})
