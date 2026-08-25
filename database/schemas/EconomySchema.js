const { Schema, model } = require('mongoose')
const EconomySchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  coins: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  inventory: { type: Array, default: [] },
}, { timestamps: true })
module.exports = model('Economy', EconomySchema)
