const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  userID: { type: String, required: true, unique: true },
  money: { type: Number, default: 0 },
  workCooldown: { type: Number, default: 0 },
  dailyCooldown: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  partner: { type: String, default: null },
  inventory: { type: Array, default: [] },
  warns: { type: Array, default: [] },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  reputation: { type: Number, default: 0 },

  // Membresía por servidor: guildID -> clanId (string)
  clans: { type: Map, of: String, default: () => new Map() },

  pet: {
    name: { type: String, default: null },
    type: { type: String, default: null },
    health: { type: Number, default: 100 },
    lastFed: { type: Date, default: Date.now }
  }
})

module.exports = model('User', UserSchema)
