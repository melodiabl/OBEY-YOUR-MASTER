const { Schema, model } = require('mongoose')
const schema = new Schema({
  schemaVersion: { type: Number, required: true, default: 1 },
  _id: { type: String, required: true }, guildId: { type: String, required: true }, actorId: { type: String, required: true },
  confirmationDigest: { type: String, required: true }, confirmed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }, payload: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
module.exports = model('ArchitectApplicationPlan', schema)
