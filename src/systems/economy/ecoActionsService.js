const UserSchema = require('../../database/schemas/UserSchema')
const { creditWallet, tryDebitWallet, getBalances } = require('./economyService')

function ensureMap (m) {
  if (m && typeof m.get === 'function') return m
  return new Map()
}

function getCooldown (user, key) {
  const map = ensureMap(user.ecoCooldowns)
  return Number(map.get(key) || 0)
}

async function setCooldown (user, key, ts) {
  const map = ensureMap(user.ecoCooldowns)
  map.set(key, Number(ts) || Date.now())
  user.ecoCooldowns = map
  user.markModified('ecoCooldowns')
  await user.save()
}

function remainingMs (lastTs, cdMs) {
  const last = Number(lastTs || 0)
  const cd = Number(cdMs || 0)
  const rem = cd - (Date.now() - last)
  return rem > 0 ? rem : 0
}

function randInt (min, max) {
  const a = Math.floor(Number(min))
  const b = Math.floor(Number(max))
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

async function doAction ({
  client,
  guildID,
  userID,
  actionKey,
  cooldownMs,
  successMin,
  successMax,
  failChance = 0.25,
  failFineMin = 10,
  failFineMax = 100
}) {
  const user = await client.db.getUserData(userID)
  const last = getCooldown(user, actionKey)
  const rem = remainingMs(last, cooldownMs)
  if (rem > 0) throw new Error(`Cooldown: ${Math.ceil(rem / 1000)}s`)

  const fail = Math.random() < Number(failChance || 0)
  await setCooldown(user, actionKey, Date.now())

  if (fail) {
    const fine = Math.max(0, randInt(failFineMin, failFineMax))
    // Multa best-effort: si no alcanza, no debita.
    try {
      await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: fine, type: 'eco_fail_fine', meta: { action: actionKey } })
      return { ok: false, fine }
    } catch (_) {
      return { ok: false, fine: 0 }
    }
  }

  const amount = Math.max(1, randInt(successMin, successMax))
  await creditWallet({ client, guildID, actorID: userID, userID, amount, type: 'eco_action_reward', meta: { action: actionKey } })
  return { ok: true, amount }
}

async function streamStart ({ client, guildID, userID }) {
  const user = await client.db.getUserData(userID)
  if (user.ecoStream?.active) throw new Error('Ya tienes un stream activo.')
  user.ecoStream = {
    active: true,
    startedAt: Date.now(),
    lastCollectAt: Date.now(),
    totalEarned: Number(user.ecoStream?.totalEarned || 0)
  }
  user.markModified('ecoStream')
  await user.save()
  return user.ecoStream
}

function streamEarnings (stream, now = Date.now()) {
  const last = Number(stream?.lastCollectAt || 0)
  const minutes = Math.max(0, (now - last) / 60000)
  // 20..60 por minuto (simple). Se paga en bloques de 1 minuto.
  const wholeMinutes = Math.floor(minutes)
  if (wholeMinutes <= 0) return 0
  let total = 0
  for (let i = 0; i < wholeMinutes; i++) total += randInt(20, 60)
  return total
}

async function streamCollect ({ client, guildID, userID }) {
  const user = await client.db.getUserData(userID)
  if (!user.ecoStream?.active) throw new Error('No tienes un stream activo.')
  const now = Date.now()
  const earned = streamEarnings(user.ecoStream, now)
  user.ecoStream.lastCollectAt = now
  user.ecoStream.totalEarned = Number(user.ecoStream.totalEarned || 0) + earned
  user.markModified('ecoStream')
  await user.save()

  if (earned > 0) {
    await creditWallet({ client, guildID, actorID: userID, userID, amount: earned, type: 'eco_stream', meta: {} })
  }
  return { earned, stream: user.ecoStream }
}

async function streamStop ({ client, guildID, userID }) {
  const user = await client.db.getUserData(userID)
  if (!user.ecoStream?.active) throw new Error('No tienes un stream activo.')
  const { earned } = await streamCollect({ client, guildID, userID })
  user.ecoStream.active = false
  user.markModified('ecoStream')
  await user.save()
  return { earned, stream: user.ecoStream }
}

async function buyProtect ({ client, guildID, userID, hours = 24, price = 500 }) {
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: price, type: 'eco_protect_buy', meta: { hours } })
  const user = await client.db.getUserData(userID)
  user.robProtectionUntil = Math.max(Number(user.robProtectionUntil || 0), Date.now() + hours * 60 * 60 * 1000)
  await user.save()
  return { until: user.robProtectionUntil, price }
}

async function buyInsurance ({ client, guildID, userID, hours = 24, price = 800 }) {
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: price, type: 'eco_insurance_buy', meta: { hours } })
  const user = await client.db.getUserData(userID)
  user.insuranceUntil = Math.max(Number(user.insuranceUntil || 0), Date.now() + hours * 60 * 60 * 1000)
  await user.save()
  return { until: user.insuranceUntil, price }
}

async function robUser ({ client, guildID, robberID, targetID }) {
  if (robberID === targetID) throw new Error('No puedes robarte a ti mismo.')
  const robber = await client.db.getUserData(robberID)
  const target = await client.db.getUserData(targetID)

  const now = Date.now()
  const last = getCooldown(robber, 'rob')
  const rem = remainingMs(last, 30 * 60_000)
  if (rem > 0) throw new Error(`Cooldown: ${Math.ceil(rem / 60)} min`)
  await setCooldown(robber, 'rob', now)

  if (Number(target.robProtectionUntil || 0) > now) {
    // Penaliza al ladrón.
    const penalty = randInt(100, 400)
    try {
      await tryDebitWallet({ client, guildID, actorID: robberID, userID: robberID, amount: penalty, type: 'eco_rob_fail', meta: { reason: 'protect' } })
      return { ok: false, reason: 'protect', penalty }
    } catch (_) {
      return { ok: false, reason: 'protect', penalty: 0 }
    }
  }

  const available = Number(target.money || 0)
  if (available < 50) return { ok: false, reason: 'poor', penalty: 0 }

  const steal = Math.min(available, randInt(50, Math.min(500, available)))
  const fail = Math.random() < 0.45
  if (fail) {
    const penalty = randInt(50, 250)
    try {
      await tryDebitWallet({ client, guildID, actorID: robberID, userID: robberID, amount: penalty, type: 'eco_rob_fail', meta: { reason: 'caught' } })
      return { ok: false, reason: 'caught', penalty }
    } catch (_) {
      return { ok: false, reason: 'caught', penalty: 0 }
    }
  }

  // Debita a la víctima de forma atómica. Luego acredita al ladrón.
  const debit = await UserSchema.findOneAndUpdate(
    { userID: targetID, money: { $gte: steal } },
    { $inc: { money: -steal } },
    { new: true }
  )
  if (!debit) return { ok: false, reason: 'race', penalty: 0 }

  await UserSchema.updateOne({ userID: robberID }, { $inc: { money: steal } })
  return { ok: true, amount: steal }
}

async function protectStatus ({ client, userID }) {
  const user = await client.db.getUserData(userID)
  const until = Number(user.robProtectionUntil || 0)
  return { until, active: until > Date.now() }
}

async function insuranceStatus ({ client, userID }) {
  const user = await client.db.getUserData(userID)
  const until = Number(user.insuranceUntil || 0)
  return { until, active: until > Date.now() }
}

module.exports = {
  doAction,
  streamStart,
  streamCollect,
  streamStop,
  buyProtect,
  buyInsurance,
  robUser,
  protectStatus,
  insuranceStatus,
  randInt,
  getBalances
}
