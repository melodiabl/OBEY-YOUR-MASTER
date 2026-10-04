const { Schema, model } = require('mongoose')
const AfkSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  reason: { type: String, default: '' },
  since: { type: Date, default: Date.now },
}, { strict: false })
module.exports = model('Afk', AfkSchema)
