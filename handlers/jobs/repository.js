const { identifier } = require('./service')
function createJobRepository(model = require('../../database/schemas/JobSchema')) {
  const scope = (id, guildId, actorId) => { identifier(id, 'job ID'); identifier(guildId, 'guild'); identifier(actorId, 'actor') }
  async function byId(id) { identifier(id, 'job ID'); await model.init(); return model.findById(id).lean() }
  return {
    async ensure(input) {
      scope(input._id, input.guildId, input.actorId); identifier(input.idempotencyKey, 'idempotency key')
      await model.init()
      const record = Object.fromEntries(['_id', 'guildId', 'actorId', 'type', 'idempotencyKey', 'correlationId'].map(key => [key, input[key]]))
      try { return (await model.create(record)).toObject() }
      catch (error) {
        if (error.code !== 11000) throw error
        const existing = await model.findOne({ guildId: input.guildId, actorId: input.actorId, idempotencyKey: input.idempotencyKey }).lean()
        if (!existing) throw error
        return existing
      }
    },
    getById: byId,
    async get(id, guildId, actorId) { scope(id, guildId, actorId); await model.init(); return model.findOne({ _id: id, guildId, actorId }).lean() },
    async list(guildId, actorId) {
      identifier(guildId, 'guild'); identifier(actorId, 'actor'); await model.init()
      return model.find({ guildId, actorId }).select('-result -token -idempotencyKey -dispatchPending').sort({ createdAt: -1, _id: -1 }).limit(20).lean()
    },
    async pending() { await model.init(); return model.find({ status: { $in: ['queued', 'running'] } }).sort({ createdAt: 1 }).limit(50).lean() },
    async markDispatched(id) { identifier(id, 'job ID'); await model.updateOne({ _id: id }, { $set: { dispatchPending: false } }) },
    async begin(id, token) {
      identifier(id, 'job ID'); identifier(token, 'worker token')
      return model.findOneAndUpdate({ _id: id, status: { $in: ['queued', 'running'] }, cancelRequested: false },
        { $set: { status: 'running', token, startedAt: new Date() }, $inc: { attempts: 1 } }, { new: true }).lean()
    },
    async checkpoint(id, token, result) {
      identifier(id, 'job ID'); identifier(token, 'worker token')
      const written = await model.updateOne({ _id: id, token, status: 'running', cancelRequested: false }, { $set: {
        result, resultSummary: { revision: result.revision, capturedAt: result.capturedAt,
          channelCount: result.channels?.length || 0, roleCount: result.roles?.length || 0 },
        progress: { completed: 1, total: 1 }, steps: [{ id: 'snapshot', status: 'completed' }],
      } })
      return written.matchedCount === 1
    },
    async finish(id, token, status, error = null) {
      identifier(id, 'job ID'); identifier(token, 'worker token')
      if (!['completed', 'queued', 'failed'].includes(status)) throw new Error('Invalid job transition')
      return model.findOneAndUpdate({ _id: id, token, status: 'running' }, [
        { $set: { status: { $cond: ['$cancelRequested', 'cancelled', status] }, error, dispatchPending: false,
          finishedAt: { $cond: [{ $or: ['$cancelRequested', { $ne: [status, 'queued'] }] }, '$$NOW', '$$REMOVE'] } } },
        { $unset: 'token' },
      ], { new: true }).lean()
    },
    async cancel(id, guildId, actorId) {
      scope(id, guildId, actorId); await model.init()
      await model.updateOne({ _id: id, guildId, actorId, status: { $in: ['queued', 'running'] } }, [{ $set: {
        cancelRequested: true,
        status: { $cond: [{ $eq: ['$status', 'queued'] }, 'cancelled', '$status'] },
        finishedAt: { $cond: [{ $eq: ['$status', 'queued'] }, '$$NOW', '$finishedAt'] },
        dispatchPending: false,
      } }])
      return this.get(id, guildId, actorId)
    },
    async deliveryFailed(id) {
      identifier(id, 'job ID')
      await model.updateOne({ _id: id, status: { $in: ['queued', 'running'] } }, [
        { $set: { status: { $cond: ['$cancelRequested', 'cancelled', 'failed'] }, dispatchPending: false, finishedAt: '$$NOW',
          error: { code: 'worker_unavailable', message: 'El worker no pudo terminar el análisis.' } } },
        { $unset: 'token' },
      ])
    },
    async finalizeCancellation(id) {
      identifier(id, 'job ID')
      return model.findOneAndUpdate({ _id: id, cancelRequested: true, status: { $in: ['queued', 'running'] } },
        { $set: { status: 'cancelled', dispatchPending: false, finishedAt: new Date() }, $unset: { token: 1 } }, { new: true }).lean()
    },
  }
}
module.exports = { createJobRepository }
