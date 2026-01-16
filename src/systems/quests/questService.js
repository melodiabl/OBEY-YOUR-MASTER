const QuestProgressSchema = require('../../database/schemas/QuestProgressSchema')
const TTLCache = require('../../core/cache/ttlCache')

function dateKeyUTC (d = new Date()) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Buffer en memoria para no escribir a MongoDB por cada mensaje (escala).
const messageBuffer = new Map()
const flushLock = new TTLCache({ defaultTtlMs: 1_000, maxSize: 200_000 })

function bufferKey (guildID, userID, key) {
  return `${guildID}:${userID}:${key}`
}

async function flushMessagesBuffered ({ guildID, userID, dateKey, amount }) {
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey,
        tasks: {
          messages: { goal: 20, progress: 0 },
          work: { goal: 1, progress: 0 }
        },
        claimed: false
      },
      $inc: { 'tasks.messages.progress': Number(amount) || 1 }
    },
    { upsert: true }
  )
}

async function flushAll () {
  const entries = [...messageBuffer.entries()]
  if (!entries.length) return
  messageBuffer.clear()

  for (const [key, value] of entries) {
    const [guildID, userID, dateKey] = key.split(':')
    const amount = Number(value?.amount || 0)
    if (!guildID || !userID || !dateKey || amount <= 0) continue
    try {
      await flushMessagesBuffered({ guildID, userID, dateKey, amount })
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

async function ensureDaily ({ guildID, userID }) {
  const key = dateKeyUTC()
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: key },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: key,
        tasks: {
          messages: { goal: 20, progress: 0 },
          work: { goal: 1, progress: 0 }
        },
        claimed: false
      }
    },
    { upsert: true, new: true }
  )
  return QuestProgressSchema.findOne({ guildID, userID, dateKey: key })
}

async function incMessages ({ guildID, userID, n = 1 }) {
  const key = dateKeyUTC()
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: key },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: key,
        tasks: {
          messages: { goal: 20, progress: 0 },
          work: { goal: 1, progress: 0 }
        },
        claimed: false
      },
      $inc: { 'tasks.messages.progress': Number(n) || 1 }
    },
    { upsert: true }
  )
}

function queueMessage ({ guildID, userID, n = 1 }) {
  const key = dateKeyUTC()
  const k = bufferKey(guildID, userID, key)
  const current = messageBuffer.get(k) || { amount: 0 }
  current.amount += Number(n) || 1
  messageBuffer.set(k, current)

  // Flush temprano por usuario (reduce memoria y mejora frescura).
  const lockKey = `flush:${k}`
  if (!flushLock.get(lockKey) && current.amount >= 10) {
    flushLock.set(lockKey, true, 2_000)
    const amount = current.amount
    messageBuffer.delete(k)
    flushMessagesBuffered({ guildID, userID, dateKey: key, amount }).catch(() => {
      const back = messageBuffer.get(k) || { amount: 0 }
      back.amount += amount
      messageBuffer.set(k, back)
    })
  }
}

async function incWork ({ guildID, userID, n = 1 }) {
  const key = dateKeyUTC()
  await QuestProgressSchema.findOneAndUpdate(
    { guildID, userID, dateKey: key },
    {
      $setOnInsert: {
        guildID,
        userID,
        dateKey: key,
        tasks: {
          messages: { goal: 20, progress: 0 },
          work: { goal: 1, progress: 0 }
        },
        claimed: false
      },
      $inc: { 'tasks.work.progress': Number(n) || 1 }
    },
    { upsert: true }
  )
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
  incMessages,
  queueMessage,
  incWork,
  isCompleted,
  dateKeyUTC
}
