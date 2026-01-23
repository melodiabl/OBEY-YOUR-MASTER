const { hasAtLeastRole } = require('./internalRoles')
const PERMS = require('./permissionKeys')

// Permisos implícitos por rol interno (base del RBAC).
// Puedes ajustar esto a futuro sin tocar los comandos.
const ROLE_DEFAULT_GRANTS = Object.freeze({
  OWNER: ['*'],
  CREATOR: ['*'],
  ADMIN: [
    PERMS.AUTH_MANAGE,
    PERMS.CONFIG_MANAGE,
    PERMS.LOGS_VIEW,
    PERMS.LOGS_MANAGE,
    PERMS.STATS_VIEW,
    PERMS.MOD_WARN,
    PERMS.MOD_TIMEOUT,
    PERMS.MOD_MANAGE,
    PERMS.ECONOMY_ADMIN,
    PERMS.ECONOMY_VIEW,
    PERMS.ITEMS_ADMIN,
    PERMS.LEVELS_XP,
    PERMS.LEVELS_CONFIG,
    PERMS.REP_CONFIG,
    PERMS.TICKETS_MANAGE,
    PERMS.SYNC_RUN
  ],
  MOD: [
    PERMS.LOGS_VIEW,
    PERMS.STATS_VIEW,
    PERMS.MOD_WARN,
    PERMS.MOD_TIMEOUT,
    PERMS.LEVELS_XP,
    PERMS.TICKETS_MANAGE
  ],
  USER: []
})

function normalizeList (v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter(Boolean)
  return [v].filter(Boolean)
}

function hasPermission ({ grants, denies }, key) {
  if (!key) return true
  if (Array.isArray(denies) && denies.includes(key)) return false
  if (Array.isArray(grants) && grants.includes('*')) return true
  if (Array.isArray(grants) && grants.includes(key)) return true
  return false
}

function authorizeInternal ({ identity, requiredRole, requiredPerms }) {
  const perms = normalizeList(requiredPerms)
  const roleOk = hasAtLeastRole(identity?.role, requiredRole)
  if (!roleOk) {
    return { ok: false, reason: `Necesitas el rol interno **${requiredRole}** (tu rol: **${identity?.role || 'DESCONOCIDO'}**)` }
  }

  const roleGrants = ROLE_DEFAULT_GRANTS?.[identity?.role] || []
  const effective = {
    grants: [...new Set([...(roleGrants || []), ...normalizeList(identity?.grants)])],
    denies: normalizeList(identity?.denies)
  }

  for (const p of perms) {
    if (!hasPermission(effective, p)) {
      return { ok: false, reason: `No tienes el permiso interno \`${p}\`` }
    }
  }

  return { ok: true }
}

module.exports = {
  authorizeInternal
}
