const { Schema, model } = require('mongoose')
const asset = new Schema({
  id: { type: String, required: true }, name: String, hash: String, width: Number, height: Number,
  bytes: Number, blob: { type: Buffer, required: true }, createdBy: String, createdAt: Date, expiresAt: Date,
}, { _id: false })
const schema = new Schema({
  guildId: { type: String, required: true, unique: true }, generation: { type: String, required: true },
  revision: { type: Number, required: true }, assets: { type: [asset], default: [] },
  slots: { type: Schema.Types.Mixed, default: {} }, expiresAt: Date,
}, { minimize: false, bufferCommands: false })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
module.exports = model('CardAssets', schema)
