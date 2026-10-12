const test = require('node:test')
const assert = require('node:assert/strict')
const { createModuleConfiguration } = require('../handlers/module-configuration')
const { moduleSettingsFixture } = require('./helpers/module-settings')
const { welcomeConfiguration } = require('../handlers/welcome-configuration')
const config = { channelId: 'channel', message: 'Hola {user}' }
function fixture() {
  const f = moduleSettingsFixture()
  f.records.set('g', { guildId: 'g', prefix: '!', welcome: { channel: 'old', msg: 'Legacy', dm: true, image: true, framecolor: 'gold' } })
  return { ...f, service: createModuleConfiguration(f.store) }
}

test('reading published config never migrates data and saving a draft leaves runtime unchanged', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  assert.equal(initial.published.schemaVersion, 1)
  assert.equal(initial.published.config.message, 'Legacy')
  assert.equal(initial.draft, null)
  assert.equal(f.writes(), 0)
  const saved = await f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision)
  assert.equal(saved.draft.revision, 1)
  assert.equal(saved.draft.updatedBy, 'admin')
  assert.equal(saved.published.revision, initial.published.revision)
  assert.equal(f.records.get('g').welcome.msg, 'Legacy')
  assert.equal(f.store.get('g', 'welcome.msg'), 'Legacy')
})

test('publication atomically consumes a draft and writes legacy aliases while preserving DM/cards', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  const draft = await f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision)
  const saved = await f.service.publish('g', 'welcome', 'admin', draft.draft.revision, initial.published.revision, 'publish-1')
  assert.equal(saved.draft, null)
  assert.equal(saved.draftRevision, 1)
  assert.deepEqual(saved.published.config, config)
  assert.equal(saved.published.updatedBy, 'admin')
  assert.equal(saved.lastPublication.operationId, 'publish-1')
  const doc = f.records.get('g')
  assert.equal(doc.welcome.msg, doc.welcome.message)
  assert.equal(doc.welcomeMessage, config.message)
  assert.equal(doc.welcomeChannel, config.channelId)
  assert.equal(doc.welcome.dm, true)
  assert.equal(doc.welcome.image, true)
  assert.equal(doc.prefix, '!')
  assert.equal(f.store.get('g', 'welcome.channel'), config.channelId)
  const repeated = await f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'publish-1')
  assert.equal(repeated.published.revision, saved.published.revision)
  assert.equal(f.writes(), 2)
})

test('two editors cannot silently overwrite a draft and legacy edits invalidate publication', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  const rival = createModuleConfiguration(new (require('../handlers/sync-map'))(f.model))
  const race = await Promise.allSettled([
    f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision),
    rival.saveDraft('g', 'welcome', 'other', { ...config, message: 'Other' }, 0, initial.published.revision),
  ])
  assert.equal(race.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(race.find(result => result.status === 'rejected').reason.code, 'configuration_conflict')
  await welcomeConfiguration(f.store).save('g', { message: 'Changed in Discord' })
  await assert.rejects(f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'stale'), error => error.code === 'configuration_conflict')
  assert.equal((await f.service.read('g', 'welcome')).draft.revision, 1)
})

test('a draft edited between inspection and publication fails its atomic revision check', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  await f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision)
  const save = f.store.model.findOneAndUpdate
  let raced = false
  f.store.model.findOneAndUpdate = async (filter, update) => {
    if (update.$inc && !raced) {
      raced = true
      const draft = f.records.get('g').configurationDrafts.welcome
      draft.revision = 2; draft.config.message = 'Newer draft'
    }
    return save(filter, update)
  }
  await assert.rejects(f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'race'), error => error.code === 'configuration_conflict')
  assert.equal(f.records.get('g').welcome.msg, 'Legacy')
})

test('storage errors do not announce success or change cached/published values', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  await f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision)
  f.setOffline(true)
  await assert.rejects(f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'offline'), error => error.code === 'configuration_storage')
  assert.equal(f.store.get('g', 'welcome.msg'), 'Legacy')
  assert.equal(f.records.get('g').configurationDrafts.welcome.state, 'editing')
})

test('a retry of the last publication does not consume a newer editing draft', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  await f.service.saveDraft('g', 'welcome', 'admin', config, 0, initial.published.revision)
  const published = await f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'replay')
  await f.service.saveDraft('g', 'welcome', 'admin', { ...config, message: 'Future' }, 1, published.published.revision)
  const replayed = await f.service.publish('g', 'welcome', 'admin', 1, initial.published.revision, 'replay')
  assert.equal(replayed.published.revision, published.published.revision)
  assert.equal(replayed.draft.revision, 2)
  assert.equal(replayed.draft.config.message, 'Future')
  assert.equal(f.writes(), 3)
})

test('unknown modules, injected identities/fields and invalid versions cannot mutate configuration', async () => {
  const f = fixture(), initial = await f.service.read('g', 'welcome')
  for (const input of [{ ...config, enabled: true }, { message: 'Missing channel' }, { ...config, channelId: { $ne: '' } }]) {
    await assert.rejects(f.service.saveDraft('g', 'welcome', 'admin', input, 0, initial.published.revision), error => error.code === 'invalid_configuration')
  }
  await assert.rejects(f.service.read('g', '__proto__'), error => error.code === 'configuration_not_found')
  await assert.rejects(f.service.saveDraft('g', 'welcome', { id: 'admin' }, config, 0, initial.published.revision), error => error.code === 'invalid_configuration')
  await assert.rejects(f.service.saveDraft('g', 'welcome', undefined, config, 0, initial.published.revision), error => error.code === 'invalid_configuration')
  await assert.rejects(f.service.saveDraft('g', 'welcome', 'admin', config, -1, initial.published.revision), error => error.code === 'invalid_configuration')
  assert.equal(f.writes(), 0)
  assert.equal((await f.service.read('other', 'welcome')).published.config.message, '')
})
