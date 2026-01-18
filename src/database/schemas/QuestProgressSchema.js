const { Schema, model } = require('mongoose')

const TaskSchema = new Schema(
  {
    goal: { type: Number, required: true },
    progress: { type: Number, default: 0 }
  },
  { _id: false }
)

const QuestProgressSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD

    tasks: {
      messages: { type: TaskSchema, required: true },
      work: { type: TaskSchema, required: true }
    },

    claimed: { type: Boolean, default: false }
  },
  { timestamps: true }
)

QuestProgressSchema.index({ guildID: 1, userID: 1, dateKey: 1 }, { unique: true })

module.exports = model('QuestProgress', QuestProgressSchema)
