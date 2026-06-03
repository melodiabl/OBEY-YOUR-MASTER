const { Schema, model } = require('mongoose')
const TicketSchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  ticketNumber: Number,
  status: { type: String, enum: ['open','closed','claimed'], default: 'open' },
  claimedBy: String,
  topic: String,
  transcript: [{ author: String, content: String, timestamp: Date }],
}, { timestamps: true })
module.exports = model('Ticket', TicketSchema)
