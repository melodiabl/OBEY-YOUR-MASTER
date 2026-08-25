const { Schema, model } = require('mongoose')

// Votos (top.gg) y premium temporal (motor v2 OBEY — adaptado de Soundy, tabla `user_vote`).
const schema = new Schema({
  userId:    { type: String, required: true },
  votedAt:   { type: Date,   default: Date.now },
  expiresAt: { type: Date,   required: true },
  type:      { type: String, default: 'vote' }, // 'vote' | 'premium' | 'regular'
}, { timestamps: false })

schema.index({ userId: 1, expiresAt: -1 })

module.exports = model('UserVote', schema)
