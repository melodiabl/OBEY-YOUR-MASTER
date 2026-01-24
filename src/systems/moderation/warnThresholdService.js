const UserSchema = require('../../database/schemas/UserSchema')
const { logAction } = require('./moderationService')

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

function parsePolicy (guildData) {
  const map = normalizeMap(guildData?.warnPolicy)
  const entries = []
  for (const [k, v] of map.entries()) {
    const n = Number(k)
    if (!Number.isFinite(n) || n <= 0) continue
    if (!v || typeof v !== 'object') continue
    const action = String(v.action || '').toLowerCase()
    const durationMs = Number(v.durationMs || 0)
    if (!action) continue
    entries.push({ threshold: n, action, durationMs })
  }
  // Default: 3 warns => kick
  if (!entries.length) entries.push({ threshold: 3, action: 'kick', durationMs: 0 })
  entries.sort((a, b) => a.threshold - b.threshold)
  return entries
}

async function handleWarnThresholdKick ({
  client,
  guild,
  targetID,
  moderatorID,
  warnsCount,
  threshold = 3
}) {
  const t = Number(threshold || 0)
  if (!t || t <= 0) return { triggered: false }
  if (Number(warnsCount || 0) < t) return { triggered: false }

  const member = await guild.members.fetch(targetID).catch(() => null)
  if (!member) return { triggered: true, kicked: false, reason: 'No pude obtener al miembro (posiblemente ya no está en el servidor).' }
  if (!member.kickable) return { triggered: true, kicked: false, reason: 'No puedo kickear a ese usuario (jerarquía/permisos).' }

  const reason = `Auto-kick: alcanzó ${t} warns`
  await member.kick(reason)

  // Limpia warns para evitar kick infinito al re-entrar (la evidencia queda en ModerationCase/Audit).
  await UserSchema.updateOne({ userID: targetID }, { $set: { warns: [] } })

  await logAction({
    guildID: guild.id,
    type: 'kick',
    targetID,
    moderatorID,
    reason,
    meta: { auto: true, via: 'warn_threshold', threshold: t }
  })

  return { triggered: true, kicked: true, threshold: t }
}

async function applyWarnPolicy ({
  client,
  guild,
  guildData,
  targetID,
  moderatorID,
  warnsCount
}) {
  const policy = parsePolicy(guildData)
  const count = Number(warnsCount || 0)
  const matched = policy.find(p => p.threshold === count)
  if (!matched) return { triggered: false }

  const member = await guild.members.fetch(targetID).catch(() => null)
  if (!member) return { triggered: true, ok: false, action: matched.action, reason: 'No pude obtener al miembro (posiblemente ya no estÃ¡).' }

  if (matched.action === 'timeout') {
    const ms = Math.max(5_000, Math.min(28 * 24 * 60 * 60_000, Number(matched.durationMs || 0) || 10 * 60_000))
    if (!member.moderatable) return { triggered: true, ok: false, action: 'timeout', reason: 'No puedo timeoutear a ese usuario (jerarquÃ­a/permisos).' }
    await member.timeout(ms, `Auto-timeout: alcanzÃ³ ${count} warns`).catch((e) => { throw e })
    await logAction({
      guildID: guild.id,
      type: 'timeout',
      targetID,
      moderatorID,
      reason: `Auto-timeout: alcanzÃ³ ${count} warns`,
      meta: { auto: true, via: 'warn_policy', threshold: count, durationMs: ms }
    })
    return { triggered: true, ok: true, action: 'timeout', durationMs: ms, threshold: count }
  }

  if (matched.action === 'kick') {
    if (!member.kickable) return { triggered: true, ok: false, action: 'kick', reason: 'No puedo kickear a ese usuario (jerarquÃ­a/permisos).' }
    const reason = `Auto-kick: alcanzÃ³ ${count} warns`
    await member.kick(reason).catch((e) => { throw e })
    await UserSchema.updateOne({ userID: targetID }, { $set: { warns: [] } }).catch(() => {})
    await logAction({
      guildID: guild.id,
      type: 'kick',
      targetID,
      moderatorID,
      reason,
      meta: { auto: true, via: 'warn_policy', threshold: count }
    })
    return { triggered: true, ok: true, action: 'kick', threshold: count }
  }

  if (matched.action === 'ban') {
    if (!member.bannable) return { triggered: true, ok: false, action: 'ban', reason: 'No puedo banear a ese usuario (jerarquÃ­a/permisos).' }
    const reason = `Auto-ban: alcanzÃ³ ${count} warns`
    await member.ban({ reason }).catch((e) => { throw e })
    await UserSchema.updateOne({ userID: targetID }, { $set: { warns: [] } }).catch(() => {})
    await logAction({
      guildID: guild.id,
      type: 'ban',
      targetID,
      moderatorID,
      reason,
      meta: { auto: true, via: 'warn_policy', threshold: count }
    })
    return { triggered: true, ok: true, action: 'ban', threshold: count }
  }

  return { triggered: true, ok: false, action: matched.action, reason: 'AcciÃ³n no soportada en warnPolicy.' }
}

module.exports = { handleWarnThresholdKick, applyWarnPolicy, parsePolicy }
