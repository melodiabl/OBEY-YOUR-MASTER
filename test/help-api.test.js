const test = require('node:test')
const assert = require('node:assert/strict')
const mount = require('../dashboard/help-routes')
const { canManageGuild } = require('../handlers/permissions')
function fixture() {
  const routes = new Map(), app = { get: (path, ...handlers) => routes.set(path, handlers) }
  let reads = 0, fresh = true
  const command = { id: 'prefix:ping', name: 'ping', invocation: 'ping', category: 'Info', description: 'Ping', aliases: [], transport: 'prefix', permissions: [], usage: 'ping' }
  const client = { guilds: { cache: new Map([['g', { id: 'g', name: 'Fixture' }]]) }, helpService: { read: async input => { reads++; return { guildId: input.guildId, prefix: '!', categories: ['Info'], commands: [command], counts: { prefix: 1, slash: 0 }, detail: null } } } }
  mount(app, client, { canManageGuild, requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'not_authenticated' }),
    requireFreshGuildPermissions: (req, res, next) => fresh ? next() : res.status(503).json({ error: 'permissions_unavailable' }) })
  async function request(user = { id: 'u', guilds: [{ id: 'g', permissions: '32' }] }, query = {}, guildId = 'g') {
    const req = { params: { guildId }, query, session: { user } }, res = { code: 200, set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body } }
    let index = 0
    const handlers = routes.get('/api/help/:guildId')
    await (async function next() { if (handlers[index]) return handlers[index++](req, res, next) })()
    return res
  }
  return { request, reads: () => reads, offline: () => { fresh = false } }
}
test('web help fails closed for missing authentication, scope and fresh permissions', async () => {
  const f = fixture()
  assert.equal((await f.request(null)).code, 401)
  assert.equal((await f.request({ id: 'u', guilds: [] })).code, 403)
  assert.equal((await f.request(undefined, {}, 'other')).code, 404)
  f.offline(); assert.equal((await f.request()).code, 503)
  assert.equal(f.reads(), 0)
})
test('web help validates query fields and returns bounded filtered metadata', async () => {
  const f = fixture()
  for (const query of [{ actorId: 'other' }, { search: { $ne: '' } }, { page: '-1' }, { search: 'x'.repeat(101) }]) assert.equal((await f.request(undefined, query)).code, 400)
  assert.equal(f.reads(), 0)
  assert.equal((await f.request(undefined, { search: 'missing' })).body.commands.length, 0)
  const result = await f.request(undefined, { search: 'ping' })
  assert.equal(result.code, 200)
  assert.equal(result.body.commands[0].id, 'prefix:ping')
  assert.equal(result.body.total, 1)
})
