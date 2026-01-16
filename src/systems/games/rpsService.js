const RpsStatsSchema = require('../../database/schemas/RpsStatsSchema')

const CHOICES = Object.freeze(['rock', 'paper', 'scissors'])

function randomChoice () {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)]
}

function outcome (player, bot) {
  if (player === bot) return 'tie'
  if (
    (player === 'rock' && bot === 'scissors') ||
    (player === 'paper' && bot === 'rock') ||
    (player === 'scissors' && bot === 'paper')
  ) return 'win'
  return 'loss'
}

async function getStats ({ guildID, userID }) {
  let doc = await RpsStatsSchema.findOne({ guildID, userID })
  if (!doc) doc = await new RpsStatsSchema({ guildID, userID }).save()
  return doc
}

async function recordResult ({ guildID, userID, result }) {
  const doc = await getStats({ guildID, userID })
  if (result === 'win') {
    doc.wins++
    doc.streak++
    doc.bestStreak = Math.max(doc.bestStreak || 0, doc.streak || 0)
  } else if (result === 'loss') {
    doc.losses++
    doc.streak = 0
  } else {
    doc.ties++
  }
  await doc.save()
  return doc
}

async function top ({ guildID, limit = 10 }) {
  return RpsStatsSchema.find({ guildID }).sort({ wins: -1, bestStreak: -1 }).limit(limit)
}

module.exports = {
  CHOICES,
  randomChoice,
  outcome,
  getStats,
  recordResult,
  top
}

