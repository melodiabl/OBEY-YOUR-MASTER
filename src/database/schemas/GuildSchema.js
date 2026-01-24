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
  appealCounter: { type: Number, default: 0 },
  appealsChannel: { type: String, default: null },
  appealsSupportRole: { type: String, default: null },
  warnPolicy: { type: Map, of: Schema.Types.Mixed, default: () => new Map() }, // threshold(string) -> { action, durationMs }
  mutedRoleId: { type: String, default: null }, // rol "Muted" para mute permanente (text+voice)

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
  maintenanceMessage: { type: String, default: null },

  // Seguridad y protecciÃ³n (configurable por servidor)
  securityAlertsChannel: { type: String, default: null }, // si null, usa logsChannel

  antiRaidEnabled: { type: Boolean, default: false },
  antiRaidJoinWindowMs: { type: Number, default: 15_000 },
  antiRaidJoinThreshold: { type: Number, default: 6 },
  antiRaidAction: { type: String, default: 'timeout' }, // timeout | kick | none
  antiRaidTimeoutMs: { type: Number, default: 10 * 60_000 },
  raidModeUntil: { type: Number, default: 0 }, // ms timestamp

  antiNukeEnabled: { type: Boolean, default: false },
  antiNukeWindowMs: { type: Number, default: 15_000 },
  antiNukeThreshold: { type: Number, default: 3 },
  antiNukePunishment: { type: String, default: 'timeout' }, // timeout | ban | none
  antiNukeTimeoutMs: { type: Number, default: 24 * 60 * 60_000 },
  securityWhitelistUsers: { type: [String], default: () => [] },
  securityWhitelistRoles: { type: [String], default: () => [] },

  altDetectionEnabled: { type: Boolean, default: false },
  altMinAccountAgeMs: { type: Number, default: 3 * 24 * 60 * 60_000 },
  altAction: { type: String, default: 'timeout' }, // timeout | kick | none
  altTimeoutMs: { type: Number, default: 30 * 60_000 },

  // AutoMod (mensajes) - configurable
  automodEnabled: { type: Boolean, default: false },
  automodBlockInvites: { type: Boolean, default: true },
  automodMaxMentions: { type: Number, default: 8 },
  automodAction: { type: String, default: 'warn' }, // delete | warn | timeout
  automodTimeoutMs: { type: Number, default: 10 * 60_000 },
  automodBadWords: { type: [String], default: () => [] },

  // Voice tools (canales temporales y controles)
  voiceTempEnabled: { type: Boolean, default: false },
  voiceTempLobbyChannel: { type: String, default: null }, // canal "join-to-create"
  voiceTempCategory: { type: String, default: null }, // categorÃ­a donde crear
  voiceTempNameTemplate: { type: String, default: 'ðŸŽ§ {user}' },
  voiceTempBitrate: { type: Number, default: 0 }, // 0 = no tocar
  voiceTempUserLimit: { type: Number, default: 0 }, // 0 = ilimitado
  voiceTempLockOnCreate: { type: Boolean, default: false }
})

module.exports = model('ConfigServer', GuildSchema)
