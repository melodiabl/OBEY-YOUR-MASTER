const { Schema, model } = require('mongoose')
const CustomCommandSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  commands: [{ trigger: String, response: String }],
}, { timestamps: true })
module.exports = model('CustomCommand', CustomCommandSchema)
