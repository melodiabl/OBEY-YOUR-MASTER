const { Schema, model } = require('mongoose')

const EconomyTransactionSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true }, // transfer | deposit | withdraw | admin_set | quest_reward
    actorID: { type: String, default: null, index: true },
    fromUserID: { type: String, default: null, index: true },
    toUserID: { type: String, default: null, index: true },
    amount: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

module.exports = model('EconomyTransaction', EconomyTransactionSchema)
