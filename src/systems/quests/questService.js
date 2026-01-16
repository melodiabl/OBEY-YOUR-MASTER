const QuestProgressSchema = require('../../database/schemas/QuestProgressSchema')
const TTLCache = require('../../core/cache/ttlCache')

function dateKeyUTC (d = new Date()) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function monthKeyUTC (d = new Date()) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `month:${yyyy}-${mm}`
}

function isoWeekUTC (d = new Date()) {
  // ISO week number in UTC.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return { year: date.getUTCFullYear(), week: weekNo }
}

function weekKeyUTC (d = new Date()) {
  const { year, week } = isoWeekUTC(d)
  return `week:${year}-W${String(week).padStart(2, '0')}`
}

function defaultTasksForPeriod (periodKey) {
  if (String(periodKey).startsWith('week:')) {
    return {
      messages: { goal: 200, progress: 0 },
      work: { goal: 10, progress: 0 }
    }
  }
  if (String(periodKey).startsWith('month:')) {
    return {
      messages: { goal: 1000, progress: 0 },
      work: { goal: 50, progress: 0 }
    }
  }
  // daily (back-compat)
  return {
    messages: { goal: 20, progress: 0 },
    work: { goal: 1, progress: 0 }
  }
}

async function ensurePeriod ({ guildID, userID, periodKey }) {
  const tasks = defaultTasksForPeriod(periodKey)
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: periodKey },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: periodKey,
        tasks,
        claimed: false
      }
    },
    { upsert: true, new: true }
  )
  return QuestProgressSchema.findOne({ guildID, userID, dateKey: periodKey })
}

async function ensureDaily ({ guildID, userID }) {
  return ensurePeriod({ guildID, userID, periodKey: dateKeyUTC() })
}

async function ensureWeekly ({ guildID, userID }) {
  return ensurePeriod({ guildID, userID, periodKey: weekKeyUTC() })
}

async function ensureMonthly ({ guildID, userID }) {
  return ensurePeriod({ guildID, userID, periodKey: monthKeyUTC() })
}

// Buffer en memoria para no escribir a MongoDB por cada mensaje (escala).
const messageBuffer = new Map()
const flushLock = new TTLCache({ defaultTtlMs: 1_000, maxSize: 200_000 })

function bufferKey (guildID, userID, key) {
  return `${guildID}:${userID}:${key}`
}

async function incMessagesForKey ({ guildID, userID, periodKey, amount }) {
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: periodKey },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: periodKey,
        tasks: defaultTasksForPeriod(periodKey),
        claimed: false
      },
      $inc: { 'tasks.messages.progress': Number(amount) || 1 }
    },
    { upsert: true }
  )
}

async function flushMessagesBuffered ({ guildID, userID, dailyKey, amount }) {
  const weeklyKey = weekKeyUTC(new Date(dailyKey + 'T00:00:00Z'))
  const monthlyKey = monthKeyUTC(new Date(dailyKey + 'T00:00:00Z'))
  await incMessagesForKey({ guildID, userID, periodKey: dailyKey, amount })
  await incMessagesForKey({ guildID, userID, periodKey: weeklyKey, amount })
  await incMessagesForKey({ guildID, userID, periodKey: monthlyKey, amount })
}

async function flushAll () {
  const entries = [...messageBuffer.entries()]
  if (!entries.length) return
  messageBuffer.clear()

  for (const [key, value] of entries) {
    const [guildID, userID, dailyKey] = key.split(':')
    const amount = Number(value?.amount || 0)
    if (!guildID || !userID || !dailyKey || amount <= 0) continue
    try {
      await flushMessagesBuffered({ guildID, userID, dailyKey, amount })
    } catch (e) {
      // Si falla, re-encola una parte para no perder todo (mejor esfuerzo).
      const current = messageBuffer.get(key) || { amount: 0 }
      current.amount += amount
      messageBuffer.set(key, current)
    }
  }
}

setInterval(() => {
  flushAll().catch(() => {})
}, 10_000).unref?.()

function queueMessage ({ guildID, userID, n = 1 }) {
  const dailyKey = dateKeyUTC()
  const k = bufferKey(guildID, userID, dailyKey)
  const current = messageBuffer.get(k) || { amount: 0 }
  current.amount += Number(n) || 1
  messageBuffer.set(k, current)

  // Flush temprano por usuario (reduce memoria y mejora frescura).
  const lockKey = `flush:${k}`
  if (!flushLock.get(lockKey) && current.amount >= 10) {
    flushLock.set(lockKey, true, 2_000)
    const amount = current.amount
    messageBuffer.delete(k)
    flushMessagesBuffered({ guildID, userID, dailyKey, amount }).catch(() => {
      const back = messageBuffer.get(k) || { amount: 0 }
      back.amount += amount
      messageBuffer.set(k, back)
    })
  }
}

async function incWorkForKey ({ guildID, userID, periodKey, n = 1 }) {
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: periodKey },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: periodKey,
        tasks: defaultTasksForPeriod(periodKey),
        claimed: false
      },
      $inc: { 'tasks.work.progress': Number(n) || 1 }
    },
    { upsert: true }
  )
}

async function incWork ({ guildID, userID, n = 1 }) {
  const dailyKey = dateKeyUTC()
  const weeklyKey = weekKeyUTC()
  const monthlyKey = monthKeyUTC()
  await incWorkForKey({ guildID, userID, periodKey: dailyKey, n })
  await incWorkForKey({ guildID, userID, periodKey: weeklyKey, n })
  await incWorkForKey({ guildID, userID, periodKey: monthlyKey, n })
}

function isCompleted (progressDoc) {
  const m = progressDoc?.tasks?.messages
  const w = progressDoc?.tasks?.work
  const okM = Number(m?.progress || 0) >= Number(m?.goal || 0)
  const okW = Number(w?.progress || 0) >= Number(w?.goal || 0)
  return okM && okW
}

module.exports = {
  ensureDaily,
  ensureWeekly,
  ensureMonthly,
  queueMessage,
  incWork,
  isCompleted,
  dateKeyUTC,
  weekKeyUTC,
  monthKeyUTC
}

