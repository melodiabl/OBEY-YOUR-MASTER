const UserSchema = require('../../database/schemas/UserSchema')
const { logAction } = require('./moderationService')

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

module.exports = { handleWarnThresholdKick }

