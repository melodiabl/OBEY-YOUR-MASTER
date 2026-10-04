const { Schema, model } = require('mongoose')
const schema = new Schema({
  guildId: { type: String, required: true },
  actorId: { type: String, required: true },
  draftRevision: { type: Number, required: true, min: 1 },
  schemaVersion: { type: Number, required: true, default: 1 },
  snapshot: { type: Schema.Types.Mixed, required: true },
  blueprint: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })
schema.index({ guildId: 1, actorId: 1 }, { unique: true })
module.exports = model('ArchitectDraft', schema)
