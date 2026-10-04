const { Schema, model } = require('mongoose')
const schema = new Schema({
  _id: { type: String, required: true },
  schemaVersion: { type: Number, default: 1, required: true },
  guildId: { type: String, required: true }, actorId: { type: String, required: true },
  type: { type: String, enum: ['architect.snapshot', 'architect.backup'], required: true },
  idempotencyKey: { type: String, required: true }, correlationId: { type: String, required: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued' },
  dispatchPending: { type: Boolean, default: true }, cancelRequested: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 }, token: String, startedAt: Date, finishedAt: Date,
  progress: { completed: { type: Number, default: 0 }, total: { type: Number, default: 1 } },
  steps: { type: [{ _id: false, id: String, status: String }], default: () => [{ id: 'snapshot', status: 'pending' }] },
  result: Schema.Types.Mixed, resultSummary: Schema.Types.Mixed, error: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true })
schema.index({ guildId: 1, actorId: 1, idempotencyKey: 1 }, { unique: true })
schema.index({ guildId: 1, actorId: 1, createdAt: -1 })
schema.index({ status: 1, createdAt: 1 })
module.exports = model('ObeyJob', schema)
