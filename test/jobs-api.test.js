const { test } = require('node:test')
const assert = require('node:assert/strict')
const { canManageGuild } = require('../handlers/permissions')
function fixture() {
  const routes = new Map(), calls = []
  const app = { get: (path, ...handlers) => routes.set(`GET ${path}`, handlers), post: (path, ...handlers) => routes.set(`POST ${path}`, handlers) }
  const jobs = { available: () => true, list: async (guild, actor) => { calls.push({ guild, actor }); return [] }, submit: async input => { calls.push(input); return { id: 'job', status: 'queued' } }, get: async () => null, cancel: async () => null }
  const restorePoints = { list: async (guild, actor) => { calls.push({ guild, actor }); return [] }, get: async (id, guild, actor) => { calls.push({ id, guild, actor }); return null } }
  const architectApplications = { prepare: async (guild, actor, blueprint) => { calls.push({ guild: guild.id, actor, blueprint }); return { id: 'plan' } }, confirm: async (guild, actor, confirmation) => { calls.push({ guild: guild.id, actor, confirmation }); return { id: 'job' } } }
  require('../dashboard/architect-routes')(app, { architect: {}, architectApplications, jobs, restorePoints, guilds: { cache: new Map([['g', { id: 'g' }]]) } }, {
    canManageGuild, requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({}), requireFreshGuildPermissions: (req, res, next) => next(),
  })
  async function request(method, suffix, user, body = {}, guildId = 'g') {
    const req = { params: { guildId, jobId: 'foreign', pointId: 'foreign' }, session: { user }, body }, res = { code: 200, set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body } }
    const handlers = routes.get(`${method} /api/architect/:guildId${/^\/(restore-points|applications)/.test(suffix) ? suffix : '/jobs' + suffix}`); let index = 0
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
test('restore point routes deny unauthorized access and enqueue only a scoped backup', async () => {
  const f = fixture()
  assert.equal((await f.request('GET', '/restore-points', null)).code, 401)
  assert.equal((await f.request('POST', '/restore-points', { id: 'actor', guilds: [] })).code, 403)
  assert.deepEqual(f.calls, [])
  assert.equal((await f.request('POST', '/restore-points', admin, { idempotencyKey: 'key', snapshot: {} })).code, 400)
  assert.equal((await f.request('POST', '/restore-points', admin, { idempotencyKey: 'key' })).code, 202)
  assert.deepEqual(f.calls, [{ guildId: 'g', actorId: 'actor', type: 'architect.backup', idempotencyKey: 'key' }])
  assert.equal((await f.request('GET', '/restore-points/:pointId', admin)).code, 404)
  assert.deepEqual(f.calls[1], { id: 'foreign', guild: 'g', actor: 'actor' })
})
test('application routes derive scope from the session and reject injected confirmation fields', async () => {
  const f = fixture()
  assert.equal((await f.request('POST', '/applications', null)).code, 401)
  assert.equal((await f.request('POST', '/applications/confirm', { id: 'actor', guilds: [] })).code, 403)
  assert.equal((await f.request('POST', '/applications', admin, { blueprint: {}, actorId: 'other' })).code, 400)
  assert.equal((await f.request('POST', '/applications/confirm', admin, { id: 'plan', confirmation: 'value', revision: 'r', blueprint: {} })).code, 400)
  assert.deepEqual(f.calls, [])
  assert.equal((await f.request('POST', '/applications', admin, { blueprint: { fixture: true } })).code, 200)
  assert.deepEqual(f.calls[0], { guild: 'g', actor: 'actor', blueprint: { fixture: true } })
  const confirmation = { id: 'plan', confirmation: 'value', revision: 'r' }
  assert.equal((await f.request('POST', '/applications/confirm', admin, confirmation)).code, 202)
  assert.deepEqual(f.calls[1], { guild: 'g', actor: 'actor', confirmation })
})
