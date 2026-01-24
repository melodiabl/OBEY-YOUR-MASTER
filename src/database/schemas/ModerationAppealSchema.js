const { Schema, model } = require('mongoose')

const ModerationAppealSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    appealNumber: { type: Number, required: true, index: true },
    userID: { type: String, required: true, index: true }, // quien apela
    createdBy: { type: String, required: true, index: true }, // normalmente = userID
    type: { type: String, default: 'unknown', index: true }, // warn | timeout | kick | ban | other
    reason: { type: String, default: null },
    status: { type: String, default: 'OPEN', index: true }, // OPEN | ACCEPTED | REJECTED | CLOSED
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    notes: { type: [Schema.Types.Mixed], default: () => [] }
  },
  { timestamps: true }
)

module.exports = model('ModerationAppeal', ModerationAppealSchema)

