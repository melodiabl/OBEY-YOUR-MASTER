const { Schema, model } = require('mongoose')

const TicketSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    ticketNumber: { type: Number, required: true },
    channelID: { type: String, required: true, index: true },
    createdBy: { type: String, required: true, index: true },
    status: { type: String, default: 'OPEN', index: true }, // OPEN | CLOSED
    claimedBy: { type: String, default: null, index: true },
    topic: { type: String, default: null },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

TicketSchema.index({ guildID: 1, ticketNumber: 1 }, { unique: true })

module.exports = model('Ticket', TicketSchema)

