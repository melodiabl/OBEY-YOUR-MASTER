const ms = require('ms')

function cleanId (raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const id = s.replace(/[<@#&!>]/g, '')
  if (!/^\d{16,20}$/.test(id)) return null
  return id
}

async function resolveUser ({ message, token }) {
  const id = cleanId(token)
  if (!id) return { id: null, user: null, member: null }

  const user = await message.client.users.fetch(id).catch(() => null)
  const member = await message.guild.members.fetch(id).catch(() => null)
  return { id, user, member }
}

function resolveMentionedUser ({ message }) {
  const user = message.mentions.users.first() || null
  const member = message.mentions.members.first() || null
  const id = user?.id || member?.id || null
  return { id, user, member }
}

async function resolveMemberFromArgs ({ message, args, index = 0 }) {
  const mentioned = resolveMentionedUser({ message })
  if (mentioned.user || mentioned.member) return mentioned
  return resolveUser({ message, token: args?.[index] })
}

function parseDurationMs (raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  const value = ms(s)
  if (!value || !Number.isFinite(value)) return null
  return value
}

function parseDurationLabel (raw) {
  const s = String(raw || '').trim()
  return s || null
}

function parseReason (args, startIndex, fallback = 'Sin razón.') {
  const text = Array.isArray(args) ? args.slice(startIndex).join(' ').trim() : ''
  return text || fallback
}

module.exports = {
  cleanId,
  resolveUser,
  resolveMentionedUser,
  resolveMemberFromArgs,
  parseDurationMs,
  parseDurationLabel,
  parseReason
}
