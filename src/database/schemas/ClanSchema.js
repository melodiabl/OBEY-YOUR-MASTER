const { Schema, model } = require('mongoose')

const ClanSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    name: { type: String, required: true },
    tag: { type: String, default: null },
    ownerID: { type: String, required: true, index: true },
    memberIDs: { type: Array, default: [] }, // [userId...]
    bank: { type: Number, default: 0 },
    motto: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    invites: { type: Array, default: [] } // [{ userID, invitedBy, createdAt }]
  },
  { timestamps: true }
)

ClanSchema.index({ guildID: 1, name: 1 }, { unique: true })

module.exports = model('Clan', ClanSchema)
