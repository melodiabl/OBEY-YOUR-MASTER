const JobProfileSchema = require('../../database/schemas/JobProfileSchema')
const { reward } = require('../economy/economyService')
const jobsCatalog = require('./jobsCatalog')

function getJob (jobId) {
  return jobsCatalog.find(j => j.id === jobId) || null
}

async function getProfile ({ guildID, userID }) {
  let doc = await JobProfileSchema.findOne({ guildID, userID })
  if (!doc) doc = await new JobProfileSchema({ guildID, userID }).save()
  return doc
}

async function setJob ({ guildID, userID, jobId }) {
  const job = getJob(jobId)
  if (!job) throw new Error('Trabajo inválido.')
  const profile = await getProfile({ guildID, userID })
  profile.jobId = job.id
  profile.jobLevel = profile.jobLevel || 1
  profile.jobXp = profile.jobXp || 0
  await profile.save()
  return profile
}

async function quitJob ({ guildID, userID }) {
  const profile = await getProfile({ guildID, userID })
  profile.jobId = null
  await profile.save()
  return profile
}

function nextLevelXp (level) {
  const l = Number(level || 1)
  return l * l * 50
}

function cooldownRemainingMs ({ profile, job, now = Date.now() }) {
  const last = Number(profile?.lastWorkAt || 0)
  const cd = Number(job?.cooldownMs || 0)
  if (!cd) return 0
  const rem = cd - (now - last)
  return rem > 0 ? rem : 0
}

async function doWork ({ client, guildID, userID }) {
  const profile = await getProfile({ guildID, userID })
  if (!profile.jobId) throw new Error('No tienes un trabajo asignado. Usa `/jobs set`.')
  const job = getJob(profile.jobId)
  if (!job) throw new Error('Tu trabajo ya no existe. Reasignalo.')

  const now = Date.now()
  const remaining = cooldownRemainingMs({ profile, job, now })
  if (remaining > 0) {
    const minutes = Math.ceil(remaining / 60000)
    throw new Error(`Debes esperar ${minutes} min para volver a trabajar.`)
  }

  const level = Number(profile.jobLevel || 1)
  const payMin = Number(job.basePayMin || 0) + Math.floor(level * 2)
  const payMax = Number(job.basePayMax || 0) + Math.floor(level * 3)
  const amount = Math.floor(Math.random() * (payMax - payMin + 1)) + payMin

  const xpGain = 10 + Math.floor(Math.random() * 11)
  profile.jobXp = Number(profile.jobXp || 0) + xpGain
  const needed = nextLevelXp(level)
  let leveledUp = false
  if (profile.jobXp >= needed) {
    profile.jobLevel = level + 1
    profile.jobXp = 0
    leveledUp = true
  }
  profile.lastWorkAt = now
  await profile.save()

  await reward({
    client,
    guildID,
    actorID: userID,
    userID,
    amount,
    meta: { type: 'job_work', jobId: job.id, jobLevel: profile.jobLevel }
  })

  return { profile, job, amount, xpGain, leveledUp }
}

async function topJobs ({ guildID, limit = 10 }) {
  return JobProfileSchema.find({ guildID, jobId: { $ne: null } }).sort({ jobLevel: -1, jobXp: -1 }).limit(limit)
}

module.exports = {
  jobsCatalog,
  getJob,
  getProfile,
  setJob,
  quitJob,
  doWork,
  topJobs,
  nextLevelXp,
  cooldownRemainingMs
}
