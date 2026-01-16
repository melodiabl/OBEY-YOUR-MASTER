const ClanSchema = require('../../database/schemas/ClanSchema')
const UserSchema = require('../../database/schemas/UserSchema')

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

async function getUserClanId ({ client, guildID, userID }) {
  const user = await client.db.getUserData(userID)
  const clans = normalizeMap(user.clans)
  return clans.get(guildID) || null
}

async function setUserClanId ({ client, guildID, userID, clanId }) {
  const user = await client.db.getUserData(userID)
  const clans = normalizeMap(user.clans)
  if (clanId) clans.set(guildID, clanId)
  else clans.delete(guildID)
  user.clans = clans
  await user.save()
}

async function createClan ({ client, guildID, ownerID, name, tag }) {
  const existingClanId = await getUserClanId({ client, guildID, userID: ownerID })
  if (existingClanId) throw new Error('Ya estás en un clan en este servidor.')

  const clan = await new ClanSchema({
    guildID,
    name,
    tag: tag || null,
    ownerID,
    memberIDs: [ownerID],
    bank: 0,
    invites: []
  }).save()

  await setUserClanId({ client, guildID, userID: ownerID, clanId: clan.id })
  return clan
}

async function getClanByUser ({ client, guildID, userID }) {
  const clanId = await getUserClanId({ client, guildID, userID })
  if (!clanId) return null
  return ClanSchema.findOne({ _id: clanId, guildID })
}

async function inviteToClan ({ client, guildID, inviterID, targetID }) {
  const clan = await getClanByUser({ client, guildID, userID: inviterID })
  if (!clan) throw new Error('No estás en un clan.')
  if (clan.ownerID !== inviterID) throw new Error('Solo el dueño del clan puede invitar (base).')

  const targetClanId = await getUserClanId({ client, guildID, userID: targetID })
  if (targetClanId) throw new Error('Ese usuario ya está en un clan.')

  const existsInvite = clan.invites?.some(i => i?.userID === targetID)
  if (existsInvite) throw new Error('Ya existe una invitación pendiente para ese usuario.')

  clan.invites.push({ userID: targetID, invitedBy: inviterID, createdAt: new Date() })
  await clan.save()
  return clan
}

async function acceptInvite ({ client, guildID, userID }) {
  const clanId = await getUserClanId({ client, guildID, userID })
  if (clanId) throw new Error('Ya estás en un clan.')

  const clan = await ClanSchema.findOne({ guildID, invites: { $elemMatch: { userID } } })
  if (!clan) throw new Error('No tienes invitaciones pendientes.')

  clan.invites = (clan.invites || []).filter(i => i?.userID !== userID)
  if (!clan.memberIDs.includes(userID)) clan.memberIDs.push(userID)
  await clan.save()

  await setUserClanId({ client, guildID, userID, clanId: clan.id })
  return clan
}

async function leaveClan ({ client, guildID, userID }) {
  const clan = await getClanByUser({ client, guildID, userID })
  if (!clan) throw new Error('No estás en un clan.')
  if (clan.ownerID === userID) throw new Error('El dueño no puede salir. Transfiere la propiedad o disuelve el clan (futuro).')

  clan.memberIDs = (clan.memberIDs || []).filter(id => id !== userID)
  await clan.save()
  await setUserClanId({ client, guildID, userID, clanId: null })
  return clan
}

async function clanDeposit ({ client, guildID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  const clan = await getClanByUser({ client, guildID, userID })
  if (!clan) throw new Error('No estás en un clan.')

  // Debitar wallet del usuario (atómico).
  const debit = await UserSchema.findOneAndUpdate(
    { userID, money: { $gte: a } },
    { $inc: { money: -a } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente.')

  clan.bank = Number(clan.bank || 0) + a
  await clan.save()
  return clan
}

module.exports = {
  createClan,
  getClanByUser,
  inviteToClan,
  acceptInvite,
  leaveClan,
  clanDeposit
}

