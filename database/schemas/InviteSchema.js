const { Schema, model } = require('mongoose')
const InviteSchema = new Schema({
  entryKey:     { type: String, required: true, unique: true }, // guildId + userId
  id:           { type: String, default: '' },
  userId:       { type: String, default: '' },
  guildId:      { type: String, default: '' },
  fake:         { type: Number, default: 0 },
  leaves:       { type: Number, default: 0 },
  invites:      { type: Number, default: 0 },
  invited:      { type: [String], default: [] },
  left:         { type: [String], default: [] },
  joinData:     { type: Object, default: { type: 'unknown', invite: null } },
  messagesCount:{ type: Number, default: 0 },
  bot:          { type: Boolean, default: false },
}, { strict: false })
module.exports = model('Invite', InviteSchema)
