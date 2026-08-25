const { Schema, model } = require('mongoose')
// recordKey = "guildId-userId" for user XP, or "guildId" for guild-level settings
const RankingSchema = new Schema({
  recordKey: { type: String, required: true, unique: true },
}, { strict: false })
module.exports = model('Ranking', RankingSchema)
