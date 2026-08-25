const { Schema, model } = require('mongoose')

// Canciones marcadas como favoritas por cada usuario (sistema "like" estilo Soundy)
const schema = new Schema({
  userId:     { type: String, required: true },
  trackId:    { type: String, required: true }, // info.identifier (o uri como fallback)
  uri:        { type: String, default: '' },
  title:      { type: String, default: '' },
  author:     { type: String, default: '' },
  artworkUrl: { type: String, default: null },
  length:     { type: Number, default: 0 },
  isStream:   { type: Boolean, default: false },
  sourceName: { type: String, default: '' },
  likedAt:    { type: Date,   default: Date.now },
}, { timestamps: false })

schema.index({ userId: 1, likedAt: -1 })
schema.index({ userId: 1, trackId: 1 }, { unique: true })

module.exports = model('LikedSongs', schema)
