const { Schema, model } = require('mongoose')

// Estadísticas de tracks + "recently played" (motor v2 OBEY — adaptado de Soundy, tabla `track_stats`).
const schema = new Schema({
  trackId:    { type: String, required: true },
  title:      { type: String, default: '' },
  author:     { type: String, default: '' },
  uri:        { type: String, default: '' },
  artwork:    { type: String, default: null },
  length:     { type: Number, default: 0 },
  isStream:   { type: Boolean, default: false },
  userId:     { type: String, required: true },
  guildId:    { type: String, required: true },
  playCount:  { type: Number, default: 1 },
  lastPlayed: { type: Date,   default: Date.now },
}, { timestamps: true })

schema.index({ guildId: 1, playCount: -1 })
schema.index({ userId: 1, lastPlayed: -1 })
schema.index({ guildId: 1, trackId: 1, userId: 1 }, { unique: true })

module.exports = model('TrackStats', schema)
