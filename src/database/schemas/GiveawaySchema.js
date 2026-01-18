const { Schema, model } = require('mongoose')

const GiveawaySchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true, index: true },
    messageID: { type: String, required: true, index: true },
    createdBy: { type: String, required: true, index: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, required: true },
    endsAt: { type: Date, required: true, index: true },
    ended: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
)

GiveawaySchema.index({ guildID: 1, messageID: 1 }, { unique: true })

module.exports = model('Giveaway', GiveawaySchema)
