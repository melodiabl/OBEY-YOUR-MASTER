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
    motto: null,
    bannerUrl: null,
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

async function requireClanByUser ({ client, guildID, userID }) {
  const clan = await getClanByUser({ client, guildID, userID })
  if (!clan) throw new Error('No estás en un clan.')
  return clan
}

function isOwner (clan, userID) {
  return String(clan.ownerID) === String(userID)
}

async function inviteToClan ({ client, guildID, inviterID, targetID }) {
  const clan = await requireClanByUser({ client, guildID, userID: inviterID })
  if (!isOwner(clan, inviterID)) throw new Error('Solo el dueño del clan puede invitar.')

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

async function declineInvite ({ client, guildID, userID }) {
  const clan = await ClanSchema.findOne({ guildID, invites: { $elemMatch: { userID } } })
  if (!clan) throw new Error('No tienes invitaciones pendientes.')
  clan.invites = (clan.invites || []).filter(i => i?.userID !== userID)
  await clan.save()
  return clan
}

async function leaveClan ({ client, guildID, userID }) {
  const clan = await requireClanByUser({ client, guildID, userID })
  if (isOwner(clan, userID)) throw new Error('El dueño no puede salir. Transfiere la propiedad o elimina el clan.')

  clan.memberIDs = (clan.memberIDs || []).filter(id => id !== userID)
  await clan.save()
  await setUserClanId({ client, guildID, userID, clanId: null })
  return clan
}

async function disbandClan ({ client, guildID, ownerID }) {
  const clan = await requireClanByUser({ client, guildID, userID: ownerID })
  if (!isOwner(clan, ownerID)) throw new Error('Solo el dueño puede eliminar el clan.')

  const members = Array.isArray(clan.memberIDs) ? clan.memberIDs.slice() : []
  await ClanSchema.deleteOne({ _id: clan.id, guildID })
  for (const uid of members) {
    await setUserClanId({ client, guildID, userID: uid, clanId: null }).catch(() => {})
  }
  return true
}

async function kickMember ({ client, guildID, ownerID, memberID }) {
  const clan = await requireClanByUser({ client, guildID, userID: ownerID })
  if (!isOwner(clan, ownerID)) throw new Error('Solo el dueño puede expulsar miembros.')
  if (memberID === ownerID) throw new Error('No puedes expulsarte a ti mismo.')
  if (!clan.memberIDs.includes(memberID)) throw new Error('Ese usuario no es miembro del clan.')
  clan.memberIDs = (clan.memberIDs || []).filter(id => id !== memberID)
  await clan.save()
  await setUserClanId({ client, guildID, userID: memberID, clanId: null })
  return clan
}

async function setMotto ({ client, guildID, userID, motto }) {
  const clan = await requireClanByUser({ client, guildID, userID })
  if (!isOwner(clan, userID)) throw new Error('Solo el dueño puede cambiar el motto.')
  const m = String(motto || '').trim()
  if (m.length > 120) throw new Error('Motto demasiado largo (máx 120).')
  clan.motto = m || null
  await clan.save()
  return clan
}

async function setBanner ({ client, guildID, userID, url }) {
  const clan = await requireClanByUser({ client, guildID, userID })
  if (!isOwner(clan, userID)) throw new Error('Solo el dueño puede cambiar el banner.')
  const u = String(url || '').trim()
  if (u && !/^https?:\/\//i.test(u)) throw new Error('URL inválida (debe empezar con http/https).')
  if (u.length > 400) throw new Error('URL demasiado larga.')
  clan.bannerUrl = u || null
  await clan.save()
  return clan
}

async function clanDeposit ({ client, guildID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  const clan = await requireClanByUser({ client, guildID, userID })

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

async function clanWithdraw ({ client, guildID, userID, amount }) {
  const a = Number(amount)
  if (!Number.isFinite(a) || a <= 0) throw new Error('Cantidad inválida.')
  const clan = await requireClanByUser({ client, guildID, userID })
  if (!isOwner(clan, userID)) throw new Error('Solo el dueño puede retirar del banco del clan.')
  if (Number(clan.bank || 0) < a) throw new Error('Banco del clan insuficiente.')

  clan.bank = Number(clan.bank || 0) - a
  await clan.save()
  await UserSchema.updateOne({ userID }, { $inc: { money: a } })
  return clan
}

async function topClans ({ guildID, limit = 10 }) {
  return ClanSchema.find({ guildID }).sort({ bank: -1 }).limit(limit)
}

module.exports = {
  createClan,
  getClanByUser,
  inviteToClan,
  acceptInvite,
  declineInvite,
  leaveClan,
  disbandClan,
  kickMember,
  setMotto,
  setBanner,
  clanDeposit,
  clanWithdraw,
  topClans
}
