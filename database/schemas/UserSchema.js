const { Schema, model } = require('mongoose')
const UserSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  // Economy
  wallet: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  lastDaily: Date,
  lastWork: Date,
  inventory: [{ item: String, amount: Number }],
  // Leveling
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  voiceXp: { type: Number, default: 0 },
  voiceLevel: { type: Number, default: 0 },
  // Profile
  bio: String,
  afk: { active: { type: Boolean, default: false }, reason: String, since: Date },
  // Invites
  invites: { type: Number, default: 0 },
  fakeInvites: { type: Number, default: 0 },
  leftInvites: { type: Number, default: 0 },
  invitedBy: String,
  // Premium
  premium: { type: Boolean, default: false },
  premiumExpiry: Date,
}, { timestamps: true })
UserSchema.index({ userId: 1, guildId: 1 }, { unique: true })
module.exports = model('User', UserSchema)
