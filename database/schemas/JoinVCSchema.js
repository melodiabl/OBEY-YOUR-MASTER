const { Schema, model } = require('mongoose')
const JoinVCSchema = new Schema({
  guildId:    { type: String, required: true, unique: true },
  vcmessages: { type: Array, default: [] },
  vcroles:    { type: Array, default: [] },
}, { strict: false })
module.exports = model('JoinVC', JoinVCSchema)
