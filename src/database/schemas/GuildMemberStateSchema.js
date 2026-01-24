const { Schema, model } = require('mongoose')

const GuildMemberStateSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    permMuted: { type: Boolean, default: false, index: true },
    muteReason: { type: String, default: null },
    mutedBy: { type: String, default: null },
    mutedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

GuildMemberStateSchema.index({ guildID: 1, userID: 1 }, { unique: true })

module.exports = model('GuildMemberState', GuildMemberStateSchema)

