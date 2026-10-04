const { test } = require('node:test')
const assert = require('node:assert/strict')
const { sessionAuth } = require('../dashboard/auth')
const { canManageGuild } = require('../handlers/permissions')
const mount = require('../handlers/music/apiRoutes')
const visible = require('../dashboard/music-visibility')

function fixture() {
  const routes = new Map(), reads = []
  const app = { get(path, ...handlers) { routes.set(path, handlers) }, post() {} }
  const auth = sessionAuth(async () => { throw new Error('expired') })
  const fresh = (req, res, next) => next()
  const repository = {
    async getTopTracks(guild, limit) { reads.push({ guild, limit }); return ['track'] },
    async getTopUsers(guild) { reads.push({ guild }); return ['user'] },
    async getTopGuilds(limit, guildIds) { reads.push({ guildIds }); return [] },
  }
  const client = { guilds: { cache: new Map([['allowed', { name: 'A' }], ['private', { name: 'P' }]]) },
    music: { playerStates: new Map(['allowed', 'private'].map(id => [id, { currentTrack: { info: { title: id } } }])) } }
  const options = { canManageGuild, requireAuth: auth, requireFreshGuildPermissions: fresh, database: repository }
  mount(app, client, options)
  visible(app, client, options)
  async function request(path, user, query = {}) {
    const req = { path, query, params: {}, session: { user } }
    const res = { code: 200, set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body } }
    const handlers = routes.get(path)
    let i = 0
    await (async function next() { if (handlers[i]) await handlers[i++](req, res, next) })()
    return res
  }
  return { request, reads }
}
const admin = () => ({ id: 'u', expires_at: Date.now() + 7200000,
  guilds: [{ id: 'allowed', permissions: '32' }, { id: 'private', permissions: '0' }] })

test('top tracks and users reject anonymous, foreign guild and injected query before DB access', async () => {
  const f = fixture()
  for (const path of ['/api/top/tracks', '/api/top/users']) {
    assert.equal((await f.request(path, undefined, { guildId: 'allowed' })).code, 401)
    assert.equal((await f.request(path, admin(), { guildId: 'private' })).code, 403)
    assert.equal((await f.request(path, admin(), { guildId: { $ne: '' } })).code, 400)
    assert.equal((await f.request(path, admin(), {})).code, 400)
  }
  assert.equal(f.reads.length, 0)
  assert.deepEqual((await f.request('/api/top/tracks', admin(), { guildId: 'allowed', limit: '999' })).body.data, ['track'])
  assert.deepEqual(f.reads, [{ guild: 'allowed', limit: 100 }])
})

test('nowplaying keeps public response empty and only exposes administrable guilds', async () => {
  const f = fixture()
  assert.deepEqual((await f.request('/api/nowplaying')).body, { tracks: [] })
  const res = await f.request('/api/nowplaying', admin())
  assert.deepEqual(res.body.tracks.map(track => track.guildId), ['allowed'])
})

test('guild ranking restricts the database aggregation to authorized guilds', async () => {
  const f = fixture()
  await f.request('/api/top/guilds', admin())
  assert.deepEqual(f.reads, [{ guildIds: ['allowed'] }])
})

test('administration requires real permission bits and rejects invalid values', () => {
  for (const permissions of ['0', '-1', 'invalid']) {
    assert.equal(canManageGuild({ guilds: [{ id: 'g', permissions }] }, 'g'), false)
  }
  for (const permissions of ['8', '32']) assert.equal(canManageGuild({ guilds: [{ id: 'g', permissions }] }, 'g'), true)
  assert.equal(canManageGuild({ guilds: [{ id: 'g', owner: true }] }, 'g'), true)
})
