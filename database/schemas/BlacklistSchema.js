const { Schema, model } = require('mongoose')
const BlacklistSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: '' },
  addedBy: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now },
})
module.exports = model('Blacklist', BlacklistSchema)
