const { Schema, model } = require('mongoose')
const GuildSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  // Settings
  prefix: { type: String, default: '!' },
  language: { type: String, default: 'es' },
  // Music
  musicChannel: String,
  musicMessage: String,
  defaultVolume: { type: Number, default: 100 },
  autoplay: { type: Boolean, default: false },
  // Moderation
  muteRole: String,
  modLogChannel: String,
  warns: { type: Map, of: [Object], default: {} },
  // Welcome/Leave
  welcomeChannel: String,
  welcomeMessage: String,
  leaveChannel: String,
  leaveMessage: String,
  // Tickets
  ticketCategory: String,
  ticketLogChannel: String,
  ticketCount: { type: Number, default: 0 },
  // Reaction roles
  reactionRoles: [{ messageId: String, channelId: String, emoji: String, roleId: String }],
  // Anti-systems
  antiSpam: { type: Boolean, default: false },
  antiLinks: { type: Boolean, default: false },
  antiCaps: { type: Boolean, default: false },
  // Leveling
  levelUpChannel: String,
  levelUpMessage: String,
  noXpChannels: [String],
  noXpRoles: [String],
  // Social log
  socialLog: { type: Map, of: String, default: {} },
  // Counters
  memberCount: String,
  botCount: String,
  totalCount: String,
  // Misc
  autoEmbed: { type: Boolean, default: false },
  autoMeme:  { type: Boolean, default: false },
  autoNsfw:  String,
  logChannels: {
    messages:   { type: String, default: null },
    members:    { type: String, default: null },
    moderation: { type: String, default: null },
    voice:      { type: String, default: null },
    server:     { type: String, default: null },
  },
  djRole:          { type: String, default: null },
  birthdayChannel: { type: String, default: null },
}, { timestamps: true, strict: false })
module.exports = model('Guild', GuildSchema)
