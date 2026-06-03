const { Schema, model } = require('mongoose')
const StatsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  commands: { type: Number, default: 0 },
  songs: { type: Number, default: 0 },
}, { timestamps: true })
module.exports = model('Stats', StatsSchema)
