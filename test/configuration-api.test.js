const test = require('node:test')
const assert = require('node:assert/strict')
const { PermissionsBitField } = require('discord.js')
const mount = require('../dashboard/configuration-routes')
const { canManageGuild } = require('../handlers/permissions')
const { moduleSettingsFixture } = require('./helpers/configuration-settings')
function fixture() {
  const f = moduleSettingsFixture(), routes = new Map()
  const app = Object.fromEntries(['get', 'put', 'post'].map(method => [method, (path, ...handlers) => routes.set(`${method.toUpperCase()} ${path}`, handlers)]))
  let permissions = true, memberAllowed = true
  const channel = { id: 'chat', name: 'chat', type: 0, permissionsFor: () => new PermissionsBitField(8n) }
  const guild = { id: 'g', name: 'Guild', channels: { fetch: async () => new Map([['chat', channel]]) }, members: { fetch: async () => ({ id: 'admin', permissions: new PermissionsBitField(memberAllowed ? 8n : 0n) }), fetchMe: async () => ({ id: 'bot' }) } }
  const client = { settings: f.store, guilds: { cache: new Map([['g', guild]]) } }
  require('../handlers/configuration')(client)
  mount(app, client, { canManageGuild,
    requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'not_authenticated' }),
    requireFreshGuildPermissions: (req, res, next) => permissions ? next() : res.status(503).json({ error: 'permissions_unavailable' }),
  })
  async function request(method, path, { user = { id: 'admin', guilds: [{ id: 'g', permissions: '32' }] }, guildId = 'g', moduleId = 'welcome', body } = {}) {
    const req = { params: { guildId, moduleId }, session: { user }, body }, res = { code: 200, set() {}, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
    const handlers = routes.get(`${method} ${path}`)
    let index = 0
    await (async function next() { if (handlers[index]) return handlers[index++](req, res, next) })()
    return res
  }
  return { ...f, request, revoke: () => { memberAllowed = false }, offlinePermissions: () => { permissions = false } }
}
const configPath = '/api/guilds/:guildId/modules/:moduleId/config', draftPath = '/api/guilds/:guildId/modules/:moduleId/draft', publishPath = '/api/guilds/:guildId/modules/:moduleId/publish'
test('module config requires authentication, fresh authorization and an installed scoped guild', async () => {
  const f = fixture()
  assert.equal((await f.request('GET', configPath, { user: null })).code, 401)
  assert.equal((await f.request('GET', configPath, { user: { id: 'member', guilds: [] } })).code, 403)
  assert.equal((await f.request('GET', configPath, { guildId: 'other' })).code, 404)
  assert.equal((await f.request('GET', configPath, { moduleId: 'music' })).code, 404)
  f.offlinePermissions()
  assert.equal((await f.request('GET', configPath)).code, 503)
  assert.equal(f.writes(), 0)
})
test('HTTP draft and publication share the real service, actor and legacy values', async () => {
  const f = fixture(), initial = (await f.request('GET', configPath)).body
  const body = { config: { channelId: 'chat', message: 'Hola' }, expectedDraftRevision: 0, expectedPublishedRevision: initial.published.revision }
  assert.equal((await f.request('PUT', draftPath, { body: { ...body, actorId: 'forged' } })).code, 400)
  const draft = await f.request('PUT', draftPath, { body })
  assert.equal(draft.code, 200)
  assert.equal(draft.body.draft.updatedBy, 'admin')
  assert.equal(f.records.get('g').welcome, undefined)
  const published = await f.request('POST', publishPath, { body: { draftRevision: 1, expectedPublishedRevision: initial.published.revision, operationId: 'http-publish' } })
  assert.equal(published.code, 200)
  assert.equal(published.body.published.config.message, 'Hola')
  assert.equal(f.records.get('g').welcome.msg, 'Hola')
  const conflict = await f.request('PUT', draftPath, { body })
  assert.equal(conflict.code, 409)
  assert.equal(conflict.body.current.published.config.message, 'Hola')
})
test('publishing revalidates Discord membership and rejects an unavailable destination', async () => {
  const f = fixture(), initial = (await f.request('GET', configPath)).body
  await f.request('PUT', draftPath, { body: { config: { channelId: 'chat', message: 'Hola' }, expectedDraftRevision: 0, expectedPublishedRevision: initial.published.revision } })
  f.revoke()
  const result = await f.request('POST', publishPath, { body: { draftRevision: 1, expectedPublishedRevision: initial.published.revision, operationId: 'denied' } })
  assert.equal(result.code, 403)
  assert.equal(f.records.get('g').welcome, undefined)
})

test('preview uses the same single-pass renderer and never persists fixture content', async () => {
  const f = fixture()
  const result = await f.request('POST', '/api/guilds/:guildId/modules/:moduleId/preview', { body: { config: { channelId: null, message: 'Hola {user} en {guild}: {count}' } } })
  assert.equal(result.code, 200)
  assert.equal(result.body.fixture, true)
  assert.equal(result.body.content, 'Hola @Miembro de ejemplo en Servidor de ejemplo: 42')
  assert.equal(f.writes(), 0)
})
