const GuildSchema = require('../../database/schemas/GuildSchema')
const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
const UserSchema = require('../../database/schemas/UserSchema')
const GuildMemberStateSchema = require('../../database/schemas/GuildMemberStateSchema')

async function nextCaseNumber (guildID) {
  const doc = await GuildSchema.findOneAndUpdate(
    { guildID },
    { $inc: { modCaseCounter: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  return doc.modCaseCounter
}

async function logCase ({ guildID, type, targetID, moderatorID, reason, meta }) {
  const caseNumber = await nextCaseNumber(guildID)
  const doc = await new ModerationCaseSchema({
    guildID,
    caseNumber,
    type,
    targetID,
    moderatorID,
    reason: reason || null,
    meta: meta || {}
  }).save()
  return doc
}

async function warnUser ({ guildID, targetID, moderatorID, reason }) {
  const warnData = { moderator: moderatorID, reason: reason || 'Sin razón.', date: new Date() }
  const updated = await UserSchema.findOneAndUpdate(
    { userID: targetID },
    { $setOnInsert: { userID: targetID }, $push: { warns: warnData } },
    { upsert: true, new: true }
  )
  const modCase = await logCase({ guildID, type: 'warn', targetID, moderatorID, reason })
  return { case: modCase, warnsCount: updated?.warns?.length || 0 }
}

async function unwarnUser ({ guildID, targetID, moderatorID, index }) {
  const user = await UserSchema.findOne({ userID: targetID })
  const warns = Array.isArray(user?.warns) ? user.warns : []
  if (!warns.length) throw new Error('Ese usuario no tiene warns.')

  let removed = null
  if (index !== null && index !== undefined) {
    const i = Number(index)
    if (!Number.isFinite(i) || i < 1 || i > warns.length) throw new Error(`Índice inválido. Rango: 1-${warns.length}`)
    removed = warns.splice(i - 1, 1)[0]
  } else {
    removed = warns.pop()
  }

  await UserSchema.updateOne(
    { userID: targetID },
    { $set: { warns } }
  )

  const reason = removed?.reason || 'Sin razón.'
  await logCase({
    guildID,
    type: 'unwarn',
    targetID,
    moderatorID,
    reason,
    meta: { index: index ?? null }
  })

  return { remaining: warns.length, removed }
}

async function timeoutUser ({ guildID, targetID, moderatorID, reason, durationMs }) {
  return logCase({
    guildID,
    type: 'timeout',
    targetID,
    moderatorID,
    reason,
    meta: { durationMs: Number(durationMs) || 0 }
  })
}

async function logAction ({ guildID, type, targetID, moderatorID, reason, meta }) {
  return logCase({ guildID, type, targetID, moderatorID, reason, meta })
}

async function getUserHistory ({ guildID, targetID, limit = 10 }) {
  const rows = await ModerationCaseSchema.find({ guildID, targetID }).sort({ createdAt: -1 }).limit(limit)
  const warnsDoc = await UserSchema.findOne({ userID: targetID })
  return { cases: rows, warnsCount: warnsDoc?.warns?.length || 0 }
}

module.exports = {
  warnUser,
  unwarnUser,
  timeoutUser,
  logAction,
  getUserHistory,
  setPermanentMute,
  clearPermanentMute,
  getPermanentMuteState
}

async function setPermanentMute ({ guildID, targetID, moderatorID, reason }) {
  const r = String(reason || 'Sin razón.').slice(0, 500)
  await GuildMemberStateSchema.findOneAndUpdate(
    { guildID, userID: targetID },
    {
      $set: {
        permMuted: true,
        muteReason: r,
        mutedBy: moderatorID,
        mutedAt: new Date()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  const modCase = await logCase({
    guildID,
    type: 'perm_mute',
    targetID,
    moderatorID,
    reason: r,
    meta: { permanent: true }
  })

  return modCase
}

async function clearPermanentMute ({ guildID, targetID, moderatorID, reason }) {
  const r = String(reason || 'Sin razón.').slice(0, 500)
  await GuildMemberStateSchema.findOneAndUpdate(
    { guildID, userID: targetID },
    {
      $set: {
        permMuted: false,
        muteReason: null,
        mutedBy: moderatorID,
        mutedAt: null
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  const modCase = await logCase({
    guildID,
    type: 'unperm_mute',
    targetID,
    moderatorID,
    reason: r,
    meta: { permanent: true }
  })

  return modCase
}

async function getPermanentMuteState ({ guildID, targetID }) {
  return GuildMemberStateSchema.findOne({ guildID, userID: targetID }).catch(() => null)
}
