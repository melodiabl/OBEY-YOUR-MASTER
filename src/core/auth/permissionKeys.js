// Claves de permisos internos (RBAC). Se usan en comandos/middlewares.
// Mantener el formato por dominio: "sistema.accion".
module.exports = Object.freeze({
  AUTH_MANAGE: 'auth.manage',
  CONFIG_MANAGE: 'config.manage',
  LOGS_VIEW: 'logs.view',
  LOGS_MANAGE: 'logs.manage',
  STATS_VIEW: 'stats.view',
  MOD_WARN: 'moderation.warn',
  MOD_TIMEOUT: 'moderation.timeout',
  MOD_MANAGE: 'moderation.manage',
  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',
  VOICE_MANAGE: 'voice.manage',
  ECONOMY_ADMIN: 'economy.admin',
  ECONOMY_VIEW: 'economy.view',
  ITEMS_ADMIN: 'items.admin',
  LEVELS_XP: 'levels.xp',
  LEVELS_CONFIG: 'levels.config',
  REP_CONFIG: 'rep.config',
  TICKETS_MANAGE: 'tickets.manage',
  SYNC_RUN: 'sync.run'
})
