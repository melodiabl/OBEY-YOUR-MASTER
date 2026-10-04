const { BlueprintError } = require('./blueprint')
function createDraftRepository(model = require('../../database/schemas/ArchitectDraftSchema')) {
  const conflict = () => new BlueprintError('Draft changed in another tab', 'draft_conflict')
  const scope = (guildId, actorId) => {
    if (typeof guildId !== 'string' || !guildId || guildId.length > 100 || typeof actorId !== 'string' || !actorId || actorId.length > 100) throw new BlueprintError('Invalid guild or actor')
  }
  return {
    async get(guildId, actorId) { scope(guildId, actorId); await model.init(); return model.findOne({ guildId, actorId }).lean() },
    async save(guildId, actorId, data, expectedRevision) {
      scope(guildId, actorId)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new BlueprintError('Invalid draft revision')
      await model.init()
      const record = { snapshot: data.snapshot, blueprint: data.blueprint }
      if (expectedRevision === 0) {
        try { return (await model.create({ guildId, actorId, draftRevision: 1, schemaVersion: 1, ...record })).toObject() }
        catch (error) { if (error.code === 11000) throw conflict(); throw error }
      }
      const doc = await model.findOneAndUpdate({ guildId, actorId, draftRevision: expectedRevision },
        { $set: record, $inc: { draftRevision: 1 } }, { new: true, runValidators: true }).lean()
      if (!doc) throw conflict()
      return doc
    },
  }
}
module.exports = { createDraftRepository }
