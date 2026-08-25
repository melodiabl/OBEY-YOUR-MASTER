const { Schema, model } = require('mongoose')

const TrackSchema = new Schema({
  title:      { type: String, required: true },
  author:     { type: String, default: 'Artista desconocido' },
  uri:        { type: String, required: true },
  artworkUrl: String,
  duration:   { type: Number, default: 0 },
  sourceName: { type: String, default: 'spotify' },
}, { _id: false })

const PlaylistSchema = new Schema({
  userId:   { type: String, required: true },
  name:     { type: String, required: true },
  tracks:   { type: [TrackSchema], default: [] },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true })

PlaylistSchema.index({ userId: 1, name: 1 }, { unique: true })

module.exports = model('Playlist', PlaylistSchema)
