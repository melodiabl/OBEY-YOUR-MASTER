const { Schema, model } = require('mongoose')
const schema = new Schema({
  guildId: { type: String, required: true, unique: true },
  sessionId: String, revision: { type: Number, default: 0 },
  voiceChannelId: String, textChannelId: String,
  currentTrack: Schema.Types.Mixed, queue: [Schema.Types.Mixed], history: [Schema.Types.Mixed],
  position: { type: Number, default: 0 }, paused: Boolean,
  volume: { type: Number, min: 0, max: 200, default: 100 },
  loop: { type: String, enum: ['none', 'track', 'queue'], default: 'none' },
  customFilters: Schema.Types.Mixed, filter: String, autoplay: Boolean, shuffle: Boolean, radioMode: Boolean,
}, { timestamps: true })
module.exports = model('MusicSession', schema)
