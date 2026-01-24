const { Schema, model } = require('mongoose')

const TempVoiceChannelSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true, index: true },
    ownerID: { type: String, required: true, index: true },
    createdByJoinLobby: { type: Boolean, default: true },
    locked: { type: Boolean, default: false }
  },
  { timestamps: true }
)

module.exports = model('TempVoiceChannel', TempVoiceChannelSchema)

