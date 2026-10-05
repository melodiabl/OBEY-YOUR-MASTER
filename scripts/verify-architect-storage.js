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
  const templateModel=require('../database/schemas/TemplateSchema'),templates=require('../handlers/templates/repository').createTemplateRepository(templateModel)
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
    const definition=require('../handlers/templates/service').officialTemplates()[0].definition
    const privateTemplate=await templates.create(guildId,definition)
    assert.deepEqual((await templates.get(privateTemplate.id,guildId)).definition,definition)
    assert.equal(await templates.get(privateTemplate.id,'other-actor'),null)
    assert.equal((await templates.list('other-actor')).length,0)
    assert.equal(await templates.remove(privateTemplate.id,'other-actor'),false)
    await assert.rejects(templates.get(privateTemplate.id,{$ne: ''}),error=>error.code==='invalid_template')
    assert.equal(await templates.remove(privateTemplate.id,guildId),true)
    assert.equal(await templates.get(privateTemplate.id,guildId),null)
    console.log(JSON.stringify({ database: 'isolated', insert: true, reload: true, concurrentWriteConflict: true, guildAndActorIsolation: true, duplicateInsertDenied: true,portablePrivateTemplatePersisted:true,templateOwnerIsolation:true,templateQueryInjectionRejected:true,templateOwnerDeletion:true }))
  } finally { await model.deleteMany({ guildId });await templateModel.deleteMany({ownerId:guildId}); await mongoose.disconnect() }
})().catch(error => { console.error(error.message); process.exitCode = 1; mongoose.disconnect() })
