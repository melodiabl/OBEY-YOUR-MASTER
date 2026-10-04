const { identifier } = require('../jobs/service')
function createRestorePointRepository(model = require('../../database/schemas/ArchitectRestorePointSchema')) {
  function scope(guildId, actorId) { identifier(guildId, 'guild'); identifier(actorId, 'actor') }
  return {
    async ensure(input) {
      scope(input.guildId, input.actorId); identifier(input._id, 'restore point'); identifier(input.jobId, 'job ID')
      await model.init()
      const record = Object.fromEntries(['_id', 'schemaVersion', 'guildId', 'actorId', 'jobId', 'createdAt', 'origin', 'snapshot', 'digest'].map(key => [key, input[key]]))
      try { return (await model.create(record)).toObject() }
      catch (error) {
        if (error.code !== 11000) throw error
        const old = await this.findByJob(input.guildId, input.actorId, input.jobId)
        if (!old) throw error
        return old
      }
    },
    async findByJob(guildId, actorId, jobId) {
      scope(guildId, actorId); identifier(jobId, 'job ID'); await model.init()
      return model.findOne({ guildId, actorId, jobId }).lean()
    },
    async get(id, guildId, actorId) {
      scope(guildId, actorId); identifier(id, 'restore point'); await model.init()
      return model.findOne({ _id: id, guildId, actorId }).lean()
    },
    async list(guildId, actorId) {
      scope(guildId, actorId); await model.init()
      return model.find({ guildId, actorId }).sort({ createdAt: -1, _id: -1 }).limit(20).lean()
    },
  }
}
module.exports = { createRestorePointRepository }
