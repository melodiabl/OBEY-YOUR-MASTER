const { Schema, model } = require('mongoose')

const JobProfileSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    jobId: { type: String, default: null },
    jobLevel: { type: Number, default: 1 },
    jobXp: { type: Number, default: 0 },
    lastWorkAt: { type: Number, default: 0 }
  },
  { timestamps: true }
)

JobProfileSchema.index({ guildID: 1, userID: 1 }, { unique: true })

module.exports = model('JobProfile', JobProfileSchema)
