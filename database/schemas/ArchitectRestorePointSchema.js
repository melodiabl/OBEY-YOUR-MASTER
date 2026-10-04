const { Schema, model } = require('mongoose')
const schema = new Schema({
  _id: { type: String, required: true }, schemaVersion: { type: Number, required: true, default: 1 },
  guildId: { type: String, required: true }, actorId: { type: String, required: true },
  jobId: { type: String, required: true }, createdAt: { type: Date, required: true },
  origin: { type: String, enum: ['manual', 'before_apply'], required: true },
  snapshot: { type: Schema.Types.Mixed, required: true }, digest: { type: String, required: true },
}, { versionKey: false })
schema.index({ guildId: 1, jobId: 1 }, { unique: true })
schema.index({ guildId: 1, actorId: 1, createdAt: -1 })
module.exports = model('ArchitectRestorePoint', schema)
