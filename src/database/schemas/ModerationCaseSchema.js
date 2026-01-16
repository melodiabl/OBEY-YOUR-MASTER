const { Schema, model } = require('mongoose')

const ModerationCaseSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    caseNumber: { type: Number, required: true },
    type: { type: String, required: true, index: true }, // warn | timeout | ban | unban | kick | purge
    targetID: { type: String, required: true, index: true },
    moderatorID: { type: String, required: true, index: true },
    reason: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

ModerationCaseSchema.index({ guildID: 1, caseNumber: 1 }, { unique: true })

module.exports = model('ModerationCase', ModerationCaseSchema)

