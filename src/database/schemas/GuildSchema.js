const { Schema, model } = require('mongoose')

const GuildSchema = new Schema({
  guildID: { type: String, index: true },

  prefix: { type: String, default: process.env.PREFIX },
  language: { type: String, default: process.env.LANGUAGE },

  aiChannel: { type: String, default: null },
  autoRole: { type: String, default: null },
  welcomeChannel: { type: String, default: null },
  suggestionChannel: { type: String, default: null },
  logsChannel: { type: String, default: null },

  // UI / identidad visual
  theme: { type: String, default: 'dark' }, // dark | light
  emojiOverrides: { type: Map, of: String, default: () => new Map() }, // key -> emoji
  visualPrefix: { type: String, default: '•' },

  // Levels / XP
  levelsEnabled: { type: Boolean, default: true },
  levelsAnnounceChannel: { type: String, default: null },
  levelsRoleRewards: { type: Map, of: String, default: () => new Map() }, // level -> roleId

  // Reputación
  repCooldownMs: { type: Number, default: 6 * 60 * 60 * 1000 },
  repDailyLimit: { type: Number, default: 5 },

  // Tickets
  ticketsCategory: { type: String, default: null },
  ticketsSupportRole: { type: String, default: null },
  ticketsPanelChannel: { type: String, default: null },
  ticketCounter: { type: Number, default: 0 },

  // Moderación
  modCaseCounter: { type: Number, default: 0 },

  // Anti-abuso base
  globalCooldownMs: { type: Number, default: 0 },

  // Activación/desactivación de módulos por servidor.
  modules: { type: Map, of: Boolean, default: () => new Map() },

  // DiscordRoleID[] -> Rol interno (OWNER/CREATOR/ADMIN/MOD/USER).
  internalRoleMappings: { type: Map, of: [String], default: () => new Map() },

  // Overrides por comando/subcomando.
  // key: "command" | "command subcommand" | "command group.subcommand"
  // value: { enabled, visibility, cooldownMs, role, perms }
  commandOverrides: { type: Map, of: Schema.Types.Mixed, default: () => new Map() },

  // Modo mantenimiento.
  maintenanceEnabled: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: null }
})

module.exports = model('ConfigServer', GuildSchema)
