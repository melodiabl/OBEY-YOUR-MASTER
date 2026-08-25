const { Schema, model } = require('mongoose')
const StatsSchema = new Schema({
  guildId: { type: String, required: true },
  commands: { type: Object, default: {} },
  messages: { type: Number, default: 0 },
}, { timestamps: true })
module.exports = model('Stats', StatsSchema)
