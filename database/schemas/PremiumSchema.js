const { Schema, model } = require('mongoose')
const PremiumSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  expiry: Date,
  by: String,
}, { timestamps: true })
module.exports = model('Premium', PremiumSchema)
