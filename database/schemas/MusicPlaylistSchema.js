const { Schema, model } = require('mongoose')

// Playlists del motor v2 (motor v2 OBEY (adaptado de Soundy): playlist + tracks fusionados:
// en Mongo guardamos los tracks embebidos en vez de tabla aparte).
const trackSchema = new Schema({
  url:  { type: String, required: true },
  info: { type: Schema.Types.Mixed, default: null }, // metadata del track (JSON)
}, { _id: true })

const schema = new Schema({
  userId:    { type: String, required: true },
  name:      { type: String, required: true },
  tracks:    { type: [trackSchema], default: [] },
}, { timestamps: true })

schema.index({ userId: 1, name: 1 }, { unique: true })

module.exports = model('MusicPlaylist', schema)
