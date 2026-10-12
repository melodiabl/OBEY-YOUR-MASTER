const { configuration, validatePatch, welcomeConfiguration, ConfigurationError } = require('./welcome-configuration')
const revisionPattern = /^[a-f0-9]{64}$/
const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9_:-]{1,100}$/.test(value)
function fail(code = 'invalid_configuration') { throw new ConfigurationError('No se pudo completar la configuración.', code) }
const supported = Object.freeze({ welcome: { schemaVersion: 1, fields: ['channelId', 'message'] } })

function createModuleConfiguration(settings) {
  function validate(guildId, moduleId, actorId) {
    if (!identifier(guildId) || actorId !== undefined && !identifier(actorId)) fail()
    if (typeof moduleId !== 'string' || !Object.hasOwn(supported, moduleId)) fail('configuration_not_found')
  }
  function draftOf(doc) {
    const draft = doc?.configurationDrafts?.welcome
    if (draft !== undefined && (!draft || draft.schemaVersion !== 1 || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || !['editing', 'published'].includes(draft.state))) fail('configuration_storage')
    return draft
  }
  function result(guildId, doc = {}) {
    const current = configuration(doc), draft = draftOf(doc), prior = doc.welcomeConfigLastWrite
    return {
      published: { guildId, moduleId: 'welcome', schemaVersion: 1, revision: current.revision,
        enabled: Boolean(current.channelId || doc.welcome?.dm || doc.welcome?.secondchannel && doc.welcome.secondchannel !== 'nochannel'),
        config: { channelId: current.channelId, message: current.message },
        updatedBy: prior?.actorId || null, updatedAt: prior?.createdAt || null },
      draft: draft?.state === 'editing' ? structuredClone(draft) : null,
      draftRevision: draft?.revision || 0,
      lastPublication: prior?.draftRevision ? { operationId: prior.id, actorId: prior.actorId, draftRevision: prior.draftRevision, publishedRevision: prior.after.revision } : null,
    }
  }
  async function stored(guildId) { return (await settings.model.findOne({ [settings.guildKey]: guildId }).lean()) || null }
  async function storage(operation) {
    try { return await operation() }
    catch (error) {
      if (error instanceof ConfigurationError) throw error
      fail(error.code === 11000 ? 'configuration_conflict' : 'configuration_storage')
    }
  }
  function revisions(draftRevision, publishedRevision) {
    if (!Number.isSafeInteger(draftRevision) || draftRevision < 0 || typeof publishedRevision !== 'string' || !revisionPattern.test(publishedRevision)) fail()
  }
  function comparePublished(filter, doc) {
    for (const key of ['welcome', 'welcomeChannel', 'welcomeMessage', 'welcomeConfigRevision']) {
      filter[key] = doc && Object.hasOwn(doc, key) ? { $eq: doc[key] } : { $exists: false }
    }
  }
  return {
    supported,
    async read(guildId, moduleId) {
      validate(guildId, moduleId)
      return storage(async () => {
        await welcomeConfiguration(settings).read(guildId)
        return settings.exclusive(async () => result(guildId, await stored(guildId) || {}))
      })
    },
    async saveDraft(guildId, moduleId, actorId, input, expectedDraftRevision, expectedPublishedRevision) {
      validate(guildId, moduleId, actorId)
      if (!identifier(actorId)) fail()
      revisions(expectedDraftRevision, expectedPublishedRevision)
      if (expectedDraftRevision === Number.MAX_SAFE_INTEGER) fail()
      if (!input || !Object.hasOwn(input, 'channelId') || !Object.hasOwn(input, 'message')) fail()
      const config = validatePatch(input)
      return storage(() => settings.exclusive(async () => {
        const doc = await stored(guildId), current = result(guildId, doc || {}), oldDraft = draftOf(doc)
        if (current.draftRevision !== expectedDraftRevision || current.published.revision !== expectedPublishedRevision) fail('configuration_conflict')
        const draft = { guildId, moduleId, schemaVersion: 1, revision: expectedDraftRevision + 1,
          baseRevision: expectedPublishedRevision, state: 'editing', config, updatedBy: actorId, updatedAt: new Date() }
        const filter = { [settings.guildKey]: guildId, 'configurationDrafts.welcome': oldDraft ? { $eq: oldDraft } : { $exists: false } }
        comparePublished(filter, doc)
        const query = settings.model.findOneAndUpdate(filter, { $set: { 'configurationDrafts.welcome': draft } }, { new: true, upsert: !doc, setDefaultsOnInsert: false })
        const saved = await (typeof query?.lean === 'function' ? query.lean() : query)
        if (!saved) fail('configuration_conflict')
        settings.patchCached(guildId, { 'configurationDrafts.welcome': saved.configurationDrafts.welcome })
        return result(guildId, saved)
      }))
    },
    async publish(guildId, moduleId, actorId, draftRevision, expectedPublishedRevision, operationId) {
      validate(guildId, moduleId, actorId)
      if (!identifier(actorId)) fail()
      revisions(draftRevision, expectedPublishedRevision)
      if (draftRevision < 1 || typeof operationId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(operationId)) fail()
      return storage(async () => {
        const doc = await settings.exclusive(() => stored(guildId)), draft = draftOf(doc)
        const prior = doc?.welcomeConfigLastWrite
        const replay = prior?.id === operationId
        if (!replay && (!draft || draft.revision !== draftRevision)) fail('configuration_conflict')
        const config = replay ? { channelId: prior.after.channelId, message: prior.after.message } : draft.config
        // save rechecks both document and draft in the atomic Mongo filter.
        await welcomeConfiguration(settings).save(guildId, config, expectedPublishedRevision, operationId, { actorId, draftRevision })
        return settings.exclusive(async () => result(guildId, await stored(guildId) || {}))
      })
    },
  }
}
module.exports = { createModuleConfiguration, supported }
