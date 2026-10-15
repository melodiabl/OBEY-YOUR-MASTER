const { Schema, model } = require('mongoose')
const schema = new Schema({
  _id: String, guildId: { type: String, required: true }, channelId: { type: String, required: true },
  revision: { type: Number, required: true, default: 0 }, content: String,
  enabled: { type: Boolean, default: false }, minMessages: Number, debounceMs: Number,
  count: { type: Number, default: 0 }, dueAt: { type: Number, default: null }, lastActivityId: String,
  currentMessageId: String, previousMessageId: String,
  operation: { type: Schema.Types.Mixed, default: null }, status: String,
}, { timestamps: true, versionKey: false })
module.exports = model('Sticky', schema)
