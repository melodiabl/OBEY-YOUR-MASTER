const { Schema, model } = require('mongoose')
const MuteSchema = new Schema({
  guildId: { type: String, required: true },
  // Legacy scheduler stores all role mutes in the MUTES document, without userId.
  userId: { type: String, default: '' },
  expiresAt: { type: Date, default: null },
  reason: { type: String, default: '' },
  moderator: { type: String, default: '' },
  channelId: { type: String, default: null },
  // The legacy role-mute scheduler uses one document keyed by guildId="MUTES".
  // Without this field Mongoose strict mode silently dropped every scheduled mute.
  MUTES: { type: [Schema.Types.Mixed], default: undefined },
}, { timestamps: true })
module.exports = model('Mute', MuteSchema)
