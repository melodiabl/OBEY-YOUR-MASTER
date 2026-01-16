const { Schema, model } = require('mongoose')

const RpsStatsSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 }
  },
  { timestamps: true }
)

RpsStatsSchema.index({ guildID: 1, userID: 1 }, { unique: true })

module.exports = model('RpsStats', RpsStatsSchema)

