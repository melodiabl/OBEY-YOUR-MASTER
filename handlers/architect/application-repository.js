const { identifier } = require('../jobs/service')
function createApplicationRepository(model = require('../../database/schemas/ArchitectApplicationPlanSchema')) {
  return {
    async create(input) {
      identifier(input._id, 'application'); identifier(input.guildId, 'guild'); identifier(input.actorId, 'actor'); await model.init()
      const record = Object.fromEntries(['_id', 'guildId', 'actorId', 'confirmationDigest', 'expiresAt', 'payload'].map(key => [key, input[key]]))
      return (await model.create(record)).toObject()
    },
    async get(id, guildId, actorId) {
      identifier(id, 'application'); identifier(guildId, 'guild'); identifier(actorId, 'actor'); await model.init()
      return model.findOne({ _id: id, guildId, actorId }).lean()
    },
    async confirm(id, guildId, actorId) {
      identifier(id, 'application'); identifier(guildId, 'guild'); identifier(actorId, 'actor')
      return model.findOneAndUpdate({ _id: id, guildId, actorId, expiresAt: { $gt: new Date() } }, { $set: { confirmed: true } }, { new: true }).lean()
    },
  }
}
function createGuildOperationRepository(model = require('../../database/schemas/ArchitectGuildOperationSchema')) {
  return {
    async claim(guildId, jobId) {
      identifier(guildId, 'guild'); identifier(jobId, 'job ID'); await model.init()
      try { await model.create({ _id: guildId, jobId }); return true }
      catch (error) {
        if (error.code !== 11000) throw error
        return Boolean(await model.exists({ _id: guildId, jobId }))
      }
    },
    async release(guildId, jobId) {
      identifier(guildId, 'guild'); identifier(jobId, 'job ID')
      await model.deleteOne({ _id: guildId, jobId })
    },
  }
}
module.exports = { createApplicationRepository, createGuildOperationRepository }
