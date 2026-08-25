const { Schema, model } = require('mongoose')

const schema = new Schema({
  guildId:    { type: String, required: true },
  uri:        { type: String, required: true },
  title:      { type: String, default: '' },
  author:     { type: String, default: '' },
  artworkUrl: { type: String, default: null },
  length:     { type: Number, default: 0 },
  sourceName: { type: String, default: '' },
  albumName:  { type: String, default: null },
  releaseDate:{ type: String, default: null },
  isrc:       { type: String, default: null },
  requester:  { type: String, default: '' },
  plays:      { type: Number, default: 1 },
  lastPlayed: { type: Date,   default: Date.now },
}, { timestamps: false })

schema.index({ guildId: 1, plays: -1 })
schema.index({ guildId: 1, uri: 1 }, { unique: true })

module.exports = model('MusicHistory', schema)
