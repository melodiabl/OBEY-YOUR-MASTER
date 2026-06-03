const { Schema, model } = require('mongoose')
const ModerationSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, enum: ['warn','mute','kick','ban','timeout'], required: true },
  reason: { type: String, default: 'No reason provided' },
  moderatorId: String,
  duration: Number,
  active: { type: Boolean, default: true },
  caseId: Number,
}, { timestamps: true })
module.exports = model('Moderation', ModerationSchema)
