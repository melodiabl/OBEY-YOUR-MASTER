// Real MongoDB verification in a new disposable collection, never user data.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const mongoose = require('mongoose'), { randomBytes } = require('node:crypto')
const { createLikedSongsService } = require('../handlers/music/likes')
async function main() {
  const values = require('dotenv').parse(fs.readFileSync(path.join(__dirname, '../.env')))
  const name = '__obey_validation_likes_' + randomBytes(8).toString('hex')
  let model, report
  await mongoose.connect(values.MONGO_URL || values.mongourl, { autoIndex: false, serverSelectionTimeoutMS: 10000 })
  try {
    model = mongoose.model('LikedVerification_' + name, require('../database/schemas/LikedSongsSchema').schema, name)
    await model.createCollection(); await model.createIndexes()
    const uri = 'https://example.test/verification', track = { encoded: 'replacement-node', info: { uri, title: 'Verification', author: 'Fixture', length: 10000 } }
    await model.create([{ userId: 'fixture-a', trackId: 'old-a', uri }, { userId: 'fixture-a', trackId: 'old-b', uri }, { userId: 'fixture-b', trackId: 'old-a', uri }])
    const service = createLikedSongsService(model)
    assert.equal(await service.getLikedSongsCount('fixture-a'), 1)
    assert.equal((await service.toggleLike('fixture-a', track)).liked, false)
    assert.equal(await model.countDocuments({ userId: 'fixture-a' }), 0)
    assert.equal(await model.countDocuments({ userId: 'fixture-b' }), 1)
    await Promise.all([service.setLiked('fixture-a', track, true), service.setLiked('fixture-a', track, true)])
    assert.equal(await model.countDocuments({ userId: 'fixture-a' }), 1)
    const restarted = createLikedSongsService(model)
    assert.equal((await restarted.getLikedSongs('fixture-a'))[0].uri, uri)
    await restarted.setLiked('fixture-a', track, false)
    assert.equal(await model.countDocuments({ userId: 'fixture-a' }), 0)
    assert.equal(await model.countDocuments({ userId: 'fixture-b' }), 1)
    report = { scope: 'Real MongoDB in a new disposable collection', legacyDeduplication: true, ownerIsolation: true, repeatedSave: true, persistedAcrossServiceRestart: true, removal: true }
  } finally {
    if (model) await model.collection.drop()
    await mongoose.disconnect()
  }
  report.collectionRemoved = true
  fs.writeFileSync(path.join(__dirname, '../docs/platform/evidence/liked-storage.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report))
}
main().catch(e => { console.error(JSON.stringify({ error: e.code || e.name })); process.exitCode = 1 })
