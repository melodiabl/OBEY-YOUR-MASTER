const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')
const { createModuleConfiguration } = require('../handlers/configuration-service')
const SyncMap = require('../handlers/sync-map')
const url = process.env.OBEY_CONFIG_TEST_MONGO_URL || ''
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_configuration_test$/.test(url)) throw new Error('Use an isolated loopback database named obey_configuration_test')
;(async () => {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 })
  const model = require('../database/schemas/GuildSchema'), guildId = `configuration-fixture-${randomUUID()}`
  await model.init()
  const store = new SyncMap(model), service = createModuleConfiguration(store)
  const other = createModuleConfiguration(new SyncMap(model))
  try {
    await model.create({ guildId, welcome: { channel: 'nochannel', msg: 'Before', dm: true, image: true }, prefix: '?' })
    const initial = await service.read(guildId, 'welcome')
    const config = { channelId: 'fixture-channel', message: 'After {user}' }
    const race = await Promise.allSettled([
      service.saveDraft(guildId, 'welcome', 'actor', config, 0, initial.published.revision),
      other.saveDraft(guildId, 'welcome', 'other', config, 0, initial.published.revision),
    ])
    assert.equal(race.filter(value => value.status === 'fulfilled').length, 1)
    assert.equal(race.find(value => value.status === 'rejected').reason.code, 'configuration_conflict')
    assert.equal((await model.findOne({ guildId }).lean()).welcome.msg, 'Before')
    const publishing = await Promise.allSettled([
      service.publish(guildId, 'welcome', 'actor', 1, initial.published.revision, 'operation-a'),
      other.publish(guildId, 'welcome', 'other', 1, initial.published.revision, 'operation-b'),
    ])
    assert.equal(publishing.filter(value => value.status === 'fulfilled').length, 1)
    assert.equal(publishing.find(value => value.status === 'rejected').reason.code, 'configuration_conflict')
    const saved = await service.read(guildId, 'welcome'), doc = await model.findOne({ guildId }).lean()
    assert.equal(saved.draft, null)
    assert.equal(doc.configurationDrafts.welcome.state, 'published')
    assert.equal(doc.welcome.msg, doc.welcome.message)
    assert.equal(doc.welcomeMessage, config.message)
    assert.equal(doc.welcome.image, true); assert.equal(doc.welcome.dm, true); assert.equal(doc.prefix, '?')
    const winner = saved.lastPublication
    await service.publish(guildId, 'welcome', winner.actorId, 1, initial.published.revision, winner.operationId)
    assert.equal((await service.read(guildId, 'welcome')).published.revision, saved.published.revision)
    await service.saveDraft(guildId, 'welcome', 'actor', { ...config, message: 'Pending' }, 1, saved.published.revision)
    await model.updateOne({ guildId }, { $set: { 'welcome.msg': 'External legacy edit' } })
    await assert.rejects(service.publish(guildId, 'welcome', 'actor', 2, saved.published.revision, 'stale'), error => error.code === 'configuration_conflict')
    console.log(JSON.stringify({ database: 'isolated', draftDoesNotActivate: true, crossInstanceDraftConflict: true, crossInstancePublishConflict: true, atomicAliasesAndDraft: true, legacyDataPreserved: true, idempotentPublication: true, legacyDriftDetected: true }))
  } finally { await model.deleteMany({ guildId }); await mongoose.disconnect() }
})().catch(error => { console.error(error.message); process.exitCode = 1; mongoose.disconnect() })
