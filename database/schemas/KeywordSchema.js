const { Schema, model } = require('mongoose')
const KeywordSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  commands: [{ trigger: String, response: String, wildcard: Boolean }],
}, { timestamps: true })
module.exports = model('Keyword', KeywordSchema)
