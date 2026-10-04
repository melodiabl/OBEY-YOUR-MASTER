// Explicitly isolated integration check. Never reads the application's Mongo URL.
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { createDraftRepository } = require('../handlers/architect/repository')
const url = process.env.OBEY_ARCHITECT_TEST_MONGO_URL || ''
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_architect_test$/.test(url)) throw new Error('Use only an isolated loopback MongoDB database named obey_architect_test')
;(async () => {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 })
  const model = require('../database/schemas/ArchitectDraftSchema')
  const repository = createDraftRepository(model), guildId = `fixture-${Date.now()}`
  try {
    const data = { snapshot: { revision: 'source' }, blueprint: { baseRevision: 'source', channels: [], roles: [] } }
    const first = await repository.save(guildId, 'u', data, 0)
    assert.equal(first.draftRevision, 1)
    const race = await Promise.allSettled([repository.save(guildId, 'u', data, 1), repository.save(guildId, 'u', data, 1)])
    assert.equal(race.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(race.find(result => result.status === 'rejected').reason.code, 'draft_conflict')
    assert.equal((await repository.get(guildId, 'u')).draftRevision, 2)
    assert.equal(await repository.get(guildId, 'other-actor'), null)
    assert.equal(await repository.get('other-guild', 'u'), null)
    await assert.rejects(repository.save(guildId, 'u', data, 0), error => error.code === 'draft_conflict')
    console.log(JSON.stringify({ database: 'isolated', insert: true, reload: true, concurrentWriteConflict: true, guildAndActorIsolation: true, duplicateInsertDenied: true }))
  } finally { await model.deleteMany({ guildId }); await mongoose.disconnect() }
})().catch(error => { console.error(error.message); process.exitCode = 1; mongoose.disconnect() })
