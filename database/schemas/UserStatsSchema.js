const { Schema, model } = require('mongoose')

// Estadísticas de reproducción por usuario/guild (motor v2 OBEY — adaptado de Soundy, tabla `user_stats`).
const schema = new Schema({
  userId:     { type: String, required: true },
  guildId:    { type: String, required: true },
  playCount:  { type: Number, default: 1 },
  lastPlayed: { type: Date,   default: Date.now },
}, { timestamps: true })

schema.index({ guildId: 1, playCount: -1 })
schema.index({ userId: 1, guildId: 1 }, { unique: true })

module.exports = model('UserStats', schema)
