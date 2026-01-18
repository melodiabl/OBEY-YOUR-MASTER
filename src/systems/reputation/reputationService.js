const ReputationSchema = require('../../database/schemas/ReputationSchema')

function dateKeyUTC (d = new Date()) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function getRepDoc ({ guildID, userID }) {
  let doc = await ReputationSchema.findOne({ guildID, userID })
  if (!doc) doc = await new ReputationSchema({ guildID, userID }).save()
  return doc
}

async function giveRep ({
  guildID,
  giverID,
  targetID,
  cooldownMs = 6 * 60 * 60 * 1000,
  dailyLimit = 5
}) {
  if (giverID === targetID) throw new Error('No puedes darte reputación a ti mismo.')

  const giver = await getRepDoc({ guildID, userID: giverID })
  const now = Date.now()

  const cd = Number(cooldownMs || 0)
  if (cd > 0 && now - Number(giver.lastGivenAt || 0) < cd) {
    const remaining = Math.ceil((cd - (now - Number(giver.lastGivenAt || 0))) / 60000)
    throw new Error(`Debes esperar ${remaining} min para volver a dar reputación.`)
  }

  const limit = Number(dailyLimit || 0)
  if (limit > 0) {
    const today = dateKeyUTC()
    if (giver.dailyKey !== today) {
      giver.dailyKey = today
      giver.dailyCount = 0
    }
    if (Number(giver.dailyCount || 0) >= limit) throw new Error(`Límite diario alcanzado (${limit}).`)
    giver.dailyCount = Number(giver.dailyCount || 0) + 1
  }

  giver.lastGivenAt = now
  await giver.save()

  await ReputationSchema.updateOne(
    { guildID, userID: targetID },
    { $inc: { rep: 1 }, $setOnInsert: { guildID, userID: targetID } },
    { upsert: true }
  )

  const target = await getRepDoc({ guildID, userID: targetID })
  return { targetRep: target.rep }
}

async function removeRep ({ guildID, targetID, amount = 1 }) {
  const a = Math.max(1, Number(amount) || 1)
  await ReputationSchema.updateOne(
    { guildID, userID: targetID },
    { $inc: { rep: -a }, $setOnInsert: { guildID, userID: targetID } },
    { upsert: true }
  )
  const target = await getRepDoc({ guildID, userID: targetID })
  if (target.rep < 0) {
    target.rep = 0
    await target.save()
  }
  return { targetRep: target.rep }
}

async function topRep ({ guildID, limit = 10 }) {
  return ReputationSchema.find({ guildID }).sort({ rep: -1 }).limit(limit)
}

module.exports = {
  getRepDoc,
  giveRep,
  removeRep,
  topRep
}
