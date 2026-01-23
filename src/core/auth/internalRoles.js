const INTERNAL_ROLES = Object.freeze({
  OWNER: 'OWNER',
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
  MOD: 'MOD',
  USER: 'USER'
})

// Orden de mayor a menor privilegio.
const INTERNAL_ROLE_ORDER = Object.freeze([
  INTERNAL_ROLES.OWNER,
  INTERNAL_ROLES.CREATOR,
  INTERNAL_ROLES.ADMIN,
  INTERNAL_ROLES.MOD,
  INTERNAL_ROLES.USER
])

function isValidInternalRole (role) {
  return INTERNAL_ROLE_ORDER.includes(role)
}

function rolePriority (role) {
  const idx = INTERNAL_ROLE_ORDER.indexOf(role)
  return idx === -1 ? INTERNAL_ROLE_ORDER.length : idx
}

function hasAtLeastRole (userRole, requiredRole) {
  if (!requiredRole) return true
  if (!isValidInternalRole(requiredRole)) return true
  if (!isValidInternalRole(userRole)) return false
  return rolePriority(userRole) <= rolePriority(requiredRole)
}

module.exports = {
  INTERNAL_ROLES,
  INTERNAL_ROLE_ORDER,
  isValidInternalRole,
  hasAtLeastRole
}
