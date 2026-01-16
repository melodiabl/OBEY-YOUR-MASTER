const GuildSchema = require('../../database/schemas/GuildSchema')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const TTLCache = require('../cache/ttlCache')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('./internalRoles')

const roleCache = new TTLCache({ defaultTtlMs: 30_000, maxSize: 50_000 })

function getOwnerIds () {
  const raw = String(process.env.OWNER_IDS || '').trim()
  if (!raw) return []
  return raw.split(/\s+/).filter(Boolean)
}

function getCacheKey (guildId, userId) {
  return `${guildId}:${userId}`
}

function normalizeRoleMappings (guildData) {
  // internalRoleMappings es un Map (mongoose) o un objeto plano.
  const mappings = guildData?.internalRoleMappings
  if (!mappings) return {}
  if (typeof mappings.get === 'function') {
    const out = {}
    for (const [k, v] of mappings.entries()) out[k] = v
    return out
  }
  return mappings
}

function pickRoleFromDiscordRoles ({ member, mappings }) {
  if (!member) return null
  const memberRoleIds = new Set(member.roles?.cache?.map(r => r.id) || [])
  for (const role of INTERNAL_ROLE_ORDER) {
    if (role === INTERNAL_ROLES.OWNER) continue
    const mappedIds = Array.isArray(mappings?.[role]) ? mappings[role] : []
    if (mappedIds.some(id => memberRoleIds.has(id))) return role
  }
  return null
}

async function resolveInternalIdentity ({ guildId, userId, member }) {
  const cached = roleCache.get(getCacheKey(guildId, userId))
  if (cached) return cached

  // OWNER global por .env (independiente de Discord).
  if (getOwnerIds().includes(userId)) {
    const identity = { role: INTERNAL_ROLES.OWNER, grants: [], denies: [] }
    roleCache.set(getCacheKey(guildId, userId), identity)
    return identity
  }

  // 1) Overrides por usuario (en DB).
  let authDoc = null
  try {
    authDoc = await MemberAuthSchema.findOne({ guildID: guildId, userID: userId })
  } catch (e) {
    // Si la DB falla, degradamos a USER (no bloquea el bot por completo).
  }

  if (authDoc?.role && isValidInternalRole(authDoc.role)) {
    const identity = {
      role: authDoc.role,
      grants: Array.isArray(authDoc.permissionsGranted) ? authDoc.permissionsGranted : [],
      denies: Array.isArray(authDoc.permissionsDenied) ? authDoc.permissionsDenied : []
    }
    roleCache.set(getCacheKey(guildId, userId), identity)
    return identity
  }

  // 2) Mapeo opcional DiscordRole -> InternalRole (config por servidor).
  try {
    const guildData = await GuildSchema.findOne({ guildID: guildId })
    const mappings = normalizeRoleMappings(guildData)
    const mappedRole = pickRoleFromDiscordRoles({ member, mappings })
    if (mappedRole) {
      const identity = { role: mappedRole, grants: [], denies: [] }
      roleCache.set(getCacheKey(guildId, userId), identity)
      return identity
    }
  } catch (e) {}

  const identity = { role: INTERNAL_ROLES.USER, grants: [], denies: [] }
  roleCache.set(getCacheKey(guildId, userId), identity)
  return identity
}

function invalidateIdentityCache ({ guildId, userId }) {
  roleCache.delete(getCacheKey(guildId, userId))
}

module.exports = {
  resolveInternalIdentity,
  invalidateIdentityCache
}

