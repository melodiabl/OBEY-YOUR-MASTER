const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const { PermissionsBitField } = require('discord.js')
const { createCanvas } = require('@napi-rs/canvas')
const { cardAssetsFixture } = require('./helpers/card-assets')
const { createCardAssets } = require('../handlers/card-assets')
const { canManageGuild } = require('../handlers/permissions')
const { csrfProtection } = require('../dashboard/security')
const { cardPool } = require('../handlers/card-pool')
test.after(async () => cardPool().close())

async function fixture(t) {
  const f = cardAssetsFixture(), app = express(), server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const origin = `http://127.0.0.1:${server.address().port}`, guild = { id: 'g', name: 'Guild', memberCount: 10 }
  let membership = true
  guild.members = { fetch: async () => ({ id: 'admin', guild, permissions: new PermissionsBitField(membership ? 8n : 0n), user: { username: 'Admin', displayAvatarURL: () => null } }) }
  const settings = { get: (id, key) => key === 'welcome.pb' ? false : key ? undefined : { welcome: { msg: 'Hola {user}' } } }
  const client = { settings, cardAssets: createCardAssets(f.model), guilds: { cache: new Map([['g', guild]]) } }
  app.use(express.json())
  app.use((req, res, next) => { req.session = { user: req.get('x-user') === 'none' ? null : { id: 'admin', guilds: [{ id: 'g', permissions: '32' }] }, csrfToken: 'fixture-csrf' }; next() })
  app.use(csrfProtection(origin))
  require('../dashboard/cards-routes')(app, client, { canManageGuild,
    requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'not_authenticated' }), requireFreshGuildPermissions: (req, res, next) => next() })
  const request = (path = '', options = {}) => fetch(origin + '/api/cards/g' + path, { ...options, headers: { 'x-csrf-token': 'fixture-csrf', ...(options.headers || {}) } })
  return { f, client, origin, request, revoke: () => { membership = false } }
}

test('HTTP upload/selection/deletion are private, CSRF guarded and scoped', async t => {
  const { request, origin } = await fixture(t), png = createCanvas(40, 20).toBuffer('image/png')
  assert.equal((await request('', { headers: { 'x-user': 'none' } })).status, 401)
  let state = await (await request()).json()
  const upload = body => ({ method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body })
  assert.equal((await request('/assets?name=bad&revision=' + state.revision, { ...upload(png), headers: { 'content-type': 'application/octet-stream', 'x-csrf-token': 'wrong' } })).status, 403)
  assert.equal((await request('/assets?name=bad&revision=' + state.revision, upload(Buffer.from('<svg/>')))).status, 422)
  const response = await request('/assets?name=fondo.png&revision=' + state.revision, upload(png))
  assert.equal(response.status, 201); state = await response.json()
  const id = state.assets[0].id
  assert.equal(state.selections.welcome, 'legacy')
  assert.equal((await request('/assets/' + id)).headers.get('cache-control'), 'private, no-store')
  assert.equal((await fetch(origin + '/api/cards/foreign/assets/' + id, { headers: { 'x-csrf-token': 'fixture-csrf' } })).status, 404)
  const json = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  let saved = await request('/selection', json('PUT', { slot: 'welcome', assetId: id, revision: state.revision }))
  assert.equal(saved.status, 200); state = await saved.json()
  assert.equal((await request('/assets/' + id, json('DELETE', { revision: state.revision }))).status, 409)
  saved = await request('/selection', json('PUT', { slot: 'welcome', assetId: null, revision: state.revision })); state = await saved.json()
  assert.equal((await request('/assets/' + id, json('DELETE', { revision: state.revision }))).status, 200)
})

test('preview generates the real PNG without writing config and rejects unknown fields and revoked access', async t => {
  const f = await fixture(t)
  const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await f.request('/preview', post({ slot: 'welcome', assetId: null, name: 'Name', actorId: 'forged' }))).status, 400)
  const response = await f.request('/preview', post({ slot: 'welcome', assetId: null, name: '<img onerror=evil()>' }))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.ok(Buffer.from(body.image, 'base64').subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
  assert.ok(body.text.includes('<img onerror=evil()>'))
  assert.equal(f.f.records.size, 0)
  f.revoke()
  assert.equal((await f.request()).status, 403)
})

test('uploaded background preview and live Discord adapter produce identical bytes after activation', async t => {
  const f = await fixture(t), image = createCanvas(40, 20).toBuffer('image/png')
  const initial = await (await f.request()).json()
  let current = await (await f.request('/assets?name=fondo.png&revision=' + initial.revision, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: image })).json()
  const id = current.assets[0].id
  const json = (method, body) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  current = await (await f.request('/selection', json('PUT', { slot: 'welcome', assetId: id, revision: current.revision }))).json()
  const preview = await (await f.request('/preview', json('POST', { slot: 'welcome', assetId: id, name: 'Obey' }))).json()
  require('../handlers/card-assets').bindCardAssets(f.client.settings, f.client.cardAssets)
  const live = await require('../handlers/cards').renderConfiguredWelcomeCard(f.client.settings, {
    guild: f.client.guilds.cache.get('g'), user: { username: 'Obey', discriminator: '0', displayAvatarURL: () => null },
  })
  assert.ok(live.equals(Buffer.from(preview.image, 'base64')))
  assert.equal(current.selections.welcome, id)
})

test('disconnecting an upload does not release its resource slot until processing ends', async t => {
  const f = await fixture(t), png = createCanvas(40, 20).toBuffer('image/png')
  let entered = 0, release
  const wait = new Promise(resolve => { release = resolve })
  f.client.cardAssets = createCardAssets(f.f.model, { normalize: async () => { entered++; await wait; return png } })
  const initial = await (await f.request()).json(), controllers = [new AbortController(), new AbortController()]
  const requests = controllers.map(controller => f.request('/assets?name=test&revision=' + initial.revision, {
    method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: png, signal: controller.signal,
  }).catch(() => null))
  let timer
  try {
    for (let attempt = 0; attempt < 100 && entered < 2; attempt++) await new Promise(resolve => setTimeout(resolve, 10))
    assert.equal(entered, 2)
    controllers.forEach(controller => controller.abort())
    await new Promise(resolve => setTimeout(resolve, 30))
    const third = await Promise.race([f.request('/assets?name=test&revision=' + initial.revision, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: png }),
      new Promise((resolve, reject) => { timer = setTimeout(() => reject(Error('Resource slot released on disconnect')), 800) })])
    assert.equal(third.status, 503)
    assert.equal(entered, 2)
  } finally { clearTimeout(timer); release(); await Promise.all(requests) }
})
