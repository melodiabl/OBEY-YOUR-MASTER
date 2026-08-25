const { Schema, model } = require('mongoose')
const RosterSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
}, { strict: false })
module.exports = model('Roster', RosterSchema)
