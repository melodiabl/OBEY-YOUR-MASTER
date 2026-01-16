const { Schema, model } = require('mongoose')

const GuildSchema = new Schema({
  guildID: String,
  prefix: {
    type: String,
    default: process.env.PREFIX
  },
  language: {
    type: String,
    default: process.env.LANGUAGE
  },
  aiChannel: {
    type: String,
    default: null
  },
  autoRole: {
    type: String,
    default: null
  },
  welcomeChannel: {
    type: String,
    default: null
  },
  suggestionChannel: {
    type: String,
    default: null
  },
  logsChannel: {
    type: String,
    default: null
  },

  // Levels / XP (config básica; el awarding se aplica en messageCreate).
  levelsEnabled: { type: Boolean, default: true },
  levelsAnnounceChannel: { type: String, default: null },
  // Map: level -> roleId
  levelsRoleRewards: { type: Map, of: String, default: () => new Map() },

  // Reputación (config básica)
  repCooldownMs: { type: Number, default: 6 * 60 * 60 * 1000 },
  repDailyLimit: { type: Number, default: 5 },

  // Tickets
  ticketsCategory: {
    type: String,
    default: null
  },
  ticketsSupportRole: {
    type: String,
    default: null
  },
  ticketsPanelChannel: {
    type: String,
    default: null
  },
  ticketCounter: {
    type: Number,
    default: 0
  },
  modCaseCounter: {
    type: Number,
    default: 0
  },
  globalCooldownMs: {
    type: Number,
    default: 0
  },

  // Activación/desactivación de módulos por servidor.
  // Se guarda como Map para permitir cientos de flags sin romper el schema.
  modules: {
    type: Map,
    of: Boolean,
    default: () => new Map()
  },

  // Mapeo opcional DiscordRoleID[] -> Rol interno (ADMIN/MOD/USER).
  // Estructura: { ADMIN: [roleId...], MOD: [roleId...], USER: [roleId...] }
  internalRoleMappings: {
    type: Map,
    of: [String],
    default: () => new Map()
  }
})

module.exports = model('ConfigServer', GuildSchema)
