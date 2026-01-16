const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  userID: { type: String, required: true, unique: true },
  money: { type: Number, default: 0 },
  workCooldown: { type: Number, default: 0 },
  dailyCooldown: { type: Number, default: 0 },
  weeklyCooldown: { type: Number, default: 0 },
  monthlyCooldown: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  dailyLastDateKey: { type: String, default: null },
  bank: { type: Number, default: 0 },

  // Cooldowns por acciรณn en economيa (beg/crime/hunt/etc).
  // Map: actionKey -> timestamp(ms)
  ecoCooldowns: { type: Map, of: Number, default: () => new Map() },

  // Stream (economيa): estado bلsico para ingresos periَdicos.
  ecoStream: {
    active: { type: Boolean, default: false },
    startedAt: { type: Number, default: 0 },
    lastCollectAt: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 }
  },

  // Anti-abuso/robos: protecciَn e insurance simple.
  robProtectionUntil: { type: Number, default: 0 },
  insuranceUntil: { type: Number, default: 0 },

  // Reputaciَn: cooldown simple.
  repCooldown: { type: Number, default: 0 },
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
    happiness: { type: Number, default: 50 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    lastFed: { type: Date, default: Date.now },
    lastPlayedAt: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }
})

module.exports = model('User', UserSchema)
