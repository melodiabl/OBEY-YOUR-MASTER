const ms = require('ms')
const { checkMemberAccess } = require('./member-access')

const MAX_TIMEOUT = 28 * 86400000
function parseTimeout(value) {
  if (typeof value !== 'string') return null
  const parts = value.split('+')
  let duration = 0
  for (const part of parts) {
    let amount
    try { amount = part.trim() ? ms(part.trim()) : undefined } catch { return null }
    if (!Number.isSafeInteger(amount) || amount <= 0) return null
    duration += amount
    if (!Number.isSafeInteger(duration) || duration > MAX_TIMEOUT) return null
  }
  return duration || null
}

function formatTimeout(duration, locale) {
  let remaining = duration
  const language = String(locale).startsWith('en') ? 'en' : 'es'
  const parts = []
  for (const [unit, size] of [['day',86400000],['hour',3600000],['minute',60000],['second',1000],['millisecond',1]]) {
    const amount = Math.floor(remaining / size)
    if (amount) parts.push(new Intl.NumberFormat(language,{style:'unit',unit,unitDisplay:'short'}).format(amount))
    remaining %= size
  }
  return parts.join(' ')
}

async function performMemberAction(client, { guild, actorId, targetId, policy, command, action, reason, duration }) {
  if (!['kick', 'timeout', 'removetimeout'].includes(action) || policy === 'slash' && action === 'removetimeout') return { status: 'permission' }
  const max = policy === 'slash' ? 7 * 86400000 : MAX_TIMEOUT
  if (action === 'timeout' && (!Number.isSafeInteger(duration) || duration < 1 || duration > max)) return { status: 'invalidDuration' }
  const access = await checkMemberAccess(client, { guild, actorId, targetId, policy, command, action })
  if (access.status !== 'allowed') return access
  const member = access.member
  const active = member.communicationDisabledUntilTimestamp > Date.now()
  if (policy === 'prefix' && action === 'timeout' && active) return { status: 'alreadyTimedOut' }
  if (action === 'removetimeout' && !active) return { status: 'notTimedOut' }
  const boundedReason = typeof reason === 'string' ? reason.slice(0, 512).toWellFormed() : ''
  const historyCutoff = new Date()
  try {
    if (action === 'kick') await member.kick(boundedReason)
    else await member.timeout(action === 'removetimeout' ? null : duration, boundedReason)
  } catch { return { status: 'actionFailed' } }
  return { status: 'applied', action, targetId, reason: boundedReason, user: member.user, duration, historyCutoff }
}

module.exports = { performMemberAction, parseTimeout, formatTimeout }
