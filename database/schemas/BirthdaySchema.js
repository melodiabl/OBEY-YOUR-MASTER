const { Schema, model } = require('mongoose')
const BirthdaySchema = new Schema({
  userId:  { type: String, required: true },
  guildId: { type: String, required: true },
  day:     { type: Number, required: true, min: 1, max: 31 },
  month:   { type: Number, required: true, min: 1, max: 12 },
}, { timestamps: true })
BirthdaySchema.index({ userId: 1, guildId: 1 }, { unique: true })
BirthdaySchema.index({ day: 1, month: 1 })
module.exports = model('Birthday', BirthdaySchema)
