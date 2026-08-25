const { Schema, model } = require('mongoose')
const QueueSavesSchema = new Schema({
  userId: { type: String, required: true, unique: true },
}, { strict: false })
module.exports = model('QueueSaves', QueueSavesSchema)
