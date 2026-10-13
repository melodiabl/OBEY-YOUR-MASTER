const test = require('node:test')
const assert = require('node:assert/strict')
const { createCanvas } = require('@napi-rs/canvas')
const { createCardAssets } = require('../handlers/card-assets')
const { cardAssetsFixture } = require('./helpers/card-assets')
const image = createCanvas(40, 20).toBuffer('image/png')

test('upload is scoped, normalized, does not activate a slot, and excludes bytes from its public view', async () => {
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async () => image })
  const initial = await service.list('g')
  const uploaded = await service.upload('g', 'admin', 'fondo.png', image, initial.revision)
  assert.equal(uploaded.assets.length, 1)
  assert.equal(uploaded.selections.welcome, 'legacy')
  assert.ok(!JSON.stringify(uploaded).includes('blob'))
  assert.ok((await service.image('g', uploaded.assets[0].id)).equals(image))
  await assert.rejects(service.image('other', uploaded.assets[0].id), error => error.code === 'asset_not_found')
})

test('atomic revisions protect quota and binding against concurrent administrators', async () => {
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async () => image })
  const before = await service.list('g')
  const uploaded = await service.upload('g', 'admin', 'one', image, before.revision)
  const assetId = uploaded.assets[0].id
  const other = createCardAssets(f.model, { normalize: async () => image })
  const race = await Promise.allSettled([service.choose('g', 'welcome', assetId, uploaded.revision), other.choose('g', 'leave', assetId, uploaded.revision)])
  assert.equal(race.filter(value => value.status === 'fulfilled').length, 1)
  assert.equal(race.find(value => value.status === 'rejected').reason.code, 'asset_conflict')
  const current = await service.list('g')
  await assert.rejects(service.remove('g', assetId, current.revision), error => error.code === 'asset_in_use')
})

test('selection, expiry, deletion and reset preserve ownership and active assets', async () => {
  const f = cardAssetsFixture(); let now = Date.now()
  const service = createCardAssets(f.model, { normalize: async () => image, now: () => new Date(now) })
  let current = await service.upload('g', 'admin', 'one', image, (await service.list('g')).revision)
  const assetId = current.assets[0].id
  current = await service.choose('g', 'welcome', assetId, current.revision)
  assert.equal((await service.background('g', 'welcome')).managed, true)
  assert.ok((await service.background('g', 'welcome')).buffer.equals(image))
  now += 8 * 86400000; await service.cleanup()
  assert.equal((await service.list('g')).assets.length, 1)
  current = await service.choose('g', 'welcome', null, (await service.list('g')).revision)
  assert.deepEqual(await service.background('g', 'welcome'), { managed: true, buffer: null })
  now += 8 * 86400000; await service.cleanup()
  assert.equal((await service.list('g')).assets.length, 0)
  await assert.rejects(service.image('g', assetId), error => error.code === 'asset_not_found')
  current = await service.choose('g', 'welcome', 'legacy', (await service.list('g')).revision)
  assert.equal((await service.background('g', 'welcome')).managed, false)
})

test('invalid upload cannot persist and duplicate images do not consume more quota', async () => {
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async buffer => { if (!buffer.equals(image)) throw Error('private native error'); return image } })
  const initial = await service.list('g')
  await assert.rejects(service.upload('g', 'admin', 'bad', Buffer.from('invalid'), initial.revision), error => error.code === 'invalid_card_image')
  assert.equal(f.records.size, 0)
  let current = await service.upload('g', 'admin', 'one', image, initial.revision)
  current = await service.upload('g', 'admin', 'duplicate', image, current.revision)
  assert.equal(current.assets.length, 1)
  await assert.rejects(service.choose('g', 'welcome', current.assets[0].id, 'bad'), error => error.code === 'invalid_asset_request')
  await assert.rejects(service.choose('g', 'other', null, current.revision), error => error.code === 'invalid_asset_request')
})

test('quota, stale uploads and token generations cannot overwrite a newly created document', async () => {
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async buffer => buffer })
  const make = color => { const canvas = createCanvas(24, 24), ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 24, 24); return canvas.toBuffer('image/png') }
  let current = await service.list('g')
  for (const color of ['red', 'green', 'blue']) current = await service.upload('g', 'admin', color, make(color), current.revision)
  await assert.rejects(service.upload('g', 'admin', 'fourth', make('white'), current.revision), error => error.code === 'asset_limit')
  const old = current.revision
  await service.purgeGuild('g')
  const fresh = await service.upload('g', 'admin', 'new', image, (await service.list('g')).revision)
  assert.notEqual(fresh.revision, old)
  await assert.rejects(service.choose('g', 'welcome', null, old), error => error.code === 'asset_conflict')
})

test('authorization is rechecked after normalization and a denied upload never persists', async () => {
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async () => image })
  await assert.rejects(service.upload('g', 'admin', 'one', image, (await service.list('g')).revision, async () => { throw Object.assign(Error('denied'), { code: 'asset_permissions' }) }), error => error.code === 'asset_permissions')
  assert.equal(f.records.size, 0)
})

test('published backgrounds are resolved by the same adapter used for Discord and web', async () => {
  const { bindCardAssets } = require('../handlers/card-assets')
  const { renderConfiguredWelcomeCard } = require('../handlers/cards')
  const f = cardAssetsFixture(), service = createCardAssets(f.model, { normalize: async () => image })
  const uploaded = await service.upload('g', 'admin', 'one', image, (await service.list('g')).revision)
  await service.choose('g', 'welcome', uploaded.assets[0].id, uploaded.revision)
  const settings = { get: (id, key) => key === 'welcome.pb' ? false : key === 'welcome.background' ? 'https://evil.test/background' : undefined }
  bindCardAssets(settings, service)
  let selected
  const renderer = { render: async (kind, prepare) => { selected = await prepare(); return image } }
  const member = { user: { username: 'Obey', discriminator: '0' }, guild: { id: 'g', name: 'Guild', memberCount: 10 } }
  await renderConfiguredWelcomeCard(settings, member, { renderer, media: { optional: () => assert.fail('Managed upload must not open a legacy URL') } })
  assert.ok(selected.backgroundBuffer.equals(image))
})
