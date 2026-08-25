const { Schema, model } = require('mongoose')
const TikTokSchema = new Schema({
  channelKey: { type: String, required: true, unique: true },
  oldvid:     { type: String, default: '' },
  message:    { type: String, default: '**{videoAuthorName}** uploaded `{videoTitle}`!\n**Watch it:** {videoURL}' },
})
module.exports = model('TikTok', TikTokSchema)
