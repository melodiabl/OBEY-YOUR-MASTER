const { Schema, model } = require('mongoose')
const MuteSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, default: null },
  reason: { type: String, default: '' },
  moderator: { type: String, default: '' },
  channelId: { type: String, default: null },
}, { timestamps: true })
module.exports = model('Mute', MuteSchema)
