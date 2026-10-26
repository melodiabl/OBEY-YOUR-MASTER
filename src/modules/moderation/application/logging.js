const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const { userSnapshot } = require('../../../../handlers/logs/snapshots')

async function emitModerationLog(client, { guildId, kind, userId, user, actorId, reason, caseId, origin = 'command' }) {
  if (!validId(guildId) || !validId(userId) || !['warningIssued', 'roleMuted', 'roleUnmuted', 'kicked'].includes(kind))
    return { status: 'skipped', code: 'invalid_record' }
  if (typeof client.logs?.emit !== 'function') return { status: 'skipped', code: 'unavailable' }
  const fields = [{ key: 'user', value: '<@' + userId + '>' }]
  if (typeof reason === 'string' && reason.trim()) fields.push({ key: 'reason', value: reason.slice(0, 1000).toWellFormed() })
  if (Number.isSafeInteger(caseId) && caseId > 0) fields.push({ key: 'case', value: '#' + caseId })
  try {
    return await client.logs.emit({ guildId, category: 'moderation', kind, subject: userSnapshot(user, userId),
      fields, requiresActor: true, actorId: validId(actorId) ? actorId : undefined, origin })
  } catch { return { status: 'failed', code: 'delivery_unconfirmed' } }
}

module.exports = { emitModerationLog }
