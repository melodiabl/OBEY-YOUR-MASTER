const { Schema, model } = require('mongoose')
// No expiry: an interrupted REST mutation must be reconciled before another application.
const schema = new Schema({ _id: { type: String, required: true }, jobId: { type: String, required: true } }, { timestamps: true })
module.exports = model('ArchitectGuildOperation', schema)
