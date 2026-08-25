const { Schema, model } = require('mongoose')
const UserProfileSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  bio: { type: String, default: '' },
  rep: { type: Number, default: 0 },
  daily: { type: Number, default: 0 },
}, { timestamps: true })
module.exports = model('UserProfile', UserProfileSchema)
