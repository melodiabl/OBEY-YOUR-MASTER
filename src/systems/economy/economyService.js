const UserSchema = require('../../database/schemas/UserSchema')
const EconomyTransactionSchema = require('../../database/schemas/EconomyTransactionSchema')

async function ensureUser (client, userID) {
  return client.db.getUserData(userID)
}

async function logTx ({ guildID, type, amount, actorID = null, fromUserID = null, toUserID = null, meta = {} }) {
  try {
    await new EconomyTransactionSchema({
      guildID,
      type,
      amount,
      actorID,
      fromUserID,
      toUserID,
      meta
    }).save()
  } catch (e) {}
}

async function getBalances (client, userID) {
  const user = await ensureUser(client, userID)
  return { money: Number(user.money || 0), bank: Number(user.bank || 0) }
}

async function transfer ({ client, guildID, actorID, fromUserID, toUserID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  if (fromUserID === toUserID) throw new Error('No puedes transferirte a ti mismo.')

  await ensureUser(client, fromUserID)
  await ensureUser(client, toUserID)

  // Debita solo si alcanza el saldo (atómico).
  const debit = await UserSchema.findOneAndUpdate(
    { userID: fromUserID, money: { $gte: a } },
    { $inc: { money: -a } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente.')

  await UserSchema.updateOne({ userID: toUserID }, { $inc: { money: a } })
  await logTx({ guildID, type: 'transfer', amount: a, actorID, fromUserID, toUserID })
}

async function deposit ({ client, guildID, actorID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  await ensureUser(client, userID)

  const debit = await UserSchema.findOneAndUpdate(
    { userID, money: { $gte: a } },
    { $inc: { money: -a, bank: a } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente en la wallet.')
  await logTx({ guildID, type: 'deposit', amount: a, actorID, fromUserID: userID, toUserID: userID })
}

async function withdraw ({ client, guildID, actorID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  await ensureUser(client, userID)

  const debit = await UserSchema.findOneAndUpdate(
    { userID, bank: { $gte: a } },
    { $inc: { bank: -a, money: a } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente en el banco.')
  await logTx({ guildID, type: 'withdraw', amount: a, actorID, fromUserID: userID, toUserID: userID })
}

async function adminSet ({ client, guildID, actorID, userID, money, bank }) {
  await ensureUser(client, userID)
  const update = {}
  if (money !== null && money !== undefined) update.money = Number(money)
  if (bank !== null && bank !== undefined) update.bank = Number(bank)
  await UserSchema.updateOne({ userID }, { $set: update })
  await logTx({ guildID, type: 'admin_set', amount: 0, actorID, toUserID: userID, meta: update })
}

async function fine ({ client, guildID, actorID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  await ensureUser(client, userID)

  const debit = await UserSchema.findOneAndUpdate(
    { userID, money: { $gte: a } },
    { $inc: { money: -a } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente en la wallet para aplicar multa.')
  await logTx({ guildID, type: 'fine', amount: a, actorID, fromUserID: userID, toUserID: userID })
}

async function reward ({ client, guildID, actorID, userID, amount, meta }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  await ensureUser(client, userID)
  await UserSchema.updateOne({ userID }, { $inc: { money: a } })
  await logTx({ guildID, type: 'quest_reward', amount: a, actorID, toUserID: userID, meta: meta || {} })
}

module.exports = {
  getBalances,
  transfer,
  deposit,
  withdraw,
  adminSet,
  fine,
  reward
}
