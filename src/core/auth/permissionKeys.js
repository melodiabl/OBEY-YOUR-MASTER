// Claves de permisos internos (RBAC). Se usan en comandos/middlewares.
// Mantener el formato por dominio: "sistema.accion".
module.exports = Object.freeze({
  AUTH_MANAGE: 'auth.manage',
  CONFIG_MANAGE: 'config.manage',
  LOGS_VIEW: 'logs.view',
  LOGS_MANAGE: 'logs.manage',
  MOD_WARN: 'moderation.warn',
  MOD_TIMEOUT: 'moderation.timeout',
  ECONOMY_ADMIN: 'economy.admin',
  SYNC_RUN: 'sync.run'
})

