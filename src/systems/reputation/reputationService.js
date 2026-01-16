const ReputationSchema = require('../../database/schemas/ReputationSchema')

async function getRepDoc ({ guildID, userID }) {
  let doc = await ReputationSchema.findOne({ guildID, userID })
  if (!doc) doc = await new ReputationSchema({ guildID, userID }).save()
  return doc
}

async function giveRep ({ guildID, giverID, targetID, cooldownMs = 6 * 60 * 60 * 1000 }) {
  if (giverID === targetID) throw new Error('No puedes darte reputación a ti mismo.')

  const giver = await getRepDoc({ guildID, userID: giverID })
  const now = Date.now()
  if (cooldownMs > 0 && now - Number(giver.lastGivenAt || 0) < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - (now - Number(giver.lastGivenAt || 0))) / 60000)
    throw new Error(`Debes esperar ${remaining} min para volver a dar reputación.`)
  }

  await ReputationSchema.updateOne({ guildID, userID: giverID }, { $set: { lastGivenAt: now } }, { upsert: true })
  await ReputationSchema.updateOne({ guildID, userID: targetID }, { $inc: { rep: 1 }, $setOnInsert: { guildID, userID: targetID } }, { upsert: true })

  const target = await getRepDoc({ guildID, userID: targetID })
  return { targetRep: target.rep }
}

async function topRep ({ guildID, limit = 10 }) {
  return ReputationSchema.find({ guildID }).sort({ rep: -1 }).limit(limit)
}

module.exports = {
  getRepDoc,
  giveRep,
  topRep
}

