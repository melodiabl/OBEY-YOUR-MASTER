const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const { createCanvas } = require('@napi-rs/canvas')
const { createCardAssets } = require('../handlers/card-assets')
const { cardPool } = require('../handlers/card-pool')
const url = process.env.OBEY_CARDS_TEST_MONGO_URL || ''
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_cards_test$/.test(url)) throw Error('Use isolated loopback database obey_cards_test')
async function main() {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 })
  const model = require('../database/schemas/CardAssetsSchema'), guildId = `cards-${randomUUID()}`
  await model.init()
  let time = Date.now()
  const service = createCardAssets(model, { now: () => new Date(time) }), other = createCardAssets(model)
  const canvas = createCanvas(40, 20); canvas.getContext('2d').fillRect(0, 0, 40, 20)
  try {
    const empty = await service.list(guildId)
    const uploaded = await service.upload(guildId, 'fixture-admin', 'fondo.png', canvas.toBuffer('image/png'), empty.revision)
    const asset = uploaded.assets[0]
    assert.ok((await other.image(guildId, asset.id)).equals(canvas.toBuffer('image/png')))
    await assert.rejects(other.image('foreign-guild', asset.id), error => error.code === 'asset_not_found')
    const race = await Promise.allSettled([service.choose(guildId, 'welcome', asset.id, uploaded.revision), other.choose(guildId, 'leave', asset.id, uploaded.revision)])
    assert.equal(race.filter(value => value.status === 'fulfilled').length, 1)
    assert.equal(race.find(value => value.status === 'rejected').reason.code, 'asset_conflict')
    const current = await service.list(guildId)
    const beforeLease = (await model.findOne({ guildId }).lean()).expiresAt
    time += 2 * 86400000
    await service.maintain([guildId])
    assert.ok((await model.findOne({ guildId }).lean()).expiresAt > beforeLease)
    assert.equal((await service.list(guildId)).revision, current.revision)
    await assert.rejects(service.remove(guildId, asset.id, current.revision), error => error.code === 'asset_in_use')
    const slot = Object.entries(current.selections).find(([, id]) => id === asset.id)[0]
    const detached = await service.choose(guildId, slot, null, current.revision)
    const cleared = await other.remove(guildId, asset.id, detached.revision)
    assert.equal(cleared.assets.length, 0)
    await assert.rejects(service.image(guildId, asset.id), error => error.code === 'asset_not_found')
    console.log(JSON.stringify({ database: 'isolated', normalizedByChild: true, binaryRoundTrip: true, guildIsolation: true,
      crossInstanceCAS: true, activeDeletionBlocked: true, detachedDeletion: true, activeRetentionLease: true, published: false }))
  } finally { await model.deleteOne({ guildId }); await cardPool().close(); await mongoose.disconnect() }
}
main().catch(error => { console.error(error.code || error.message); mongoose.disconnect(); process.exitCode = 1 })
