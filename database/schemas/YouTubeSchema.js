const { Schema, model } = require('mongoose')
const YouTubeSchema = new Schema({
  channelKey: { type: String, required: true, unique: true },
  oldvid:     { type: String, default: '' },
  alrsent:    { type: Array, default: [] },
  message:    { type: String, default: '**{videoAuthorName}** uploaded `{videoTitle}`!\n**Watch it:** {videoURL}' },
})
module.exports = model('YouTube', YouTubeSchema)
