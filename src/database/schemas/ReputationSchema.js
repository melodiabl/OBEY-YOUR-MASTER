const { Schema, model } = require('mongoose')

const ReputationSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    rep: { type: Number, default: 0 },
    lastGivenAt: { type: Number, default: 0 }, // anti-abuso: timestamp por usuario (giver)
    dailyKey: { type: String, default: null }, // YYYY-MM-DD (UTC)
    dailyCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

ReputationSchema.index({ guildID: 1, userID: 1 }, { unique: true })

module.exports = model('Reputation', ReputationSchema)
