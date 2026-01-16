const UserSchema = require('../../database/schemas/UserSchema')
const ItemSchema = require('../../database/schemas/ItemSchema')
const itemsCatalog = require('./itemsCatalog')
const { reward } = require('../economy/economyService')

async function ensureCatalog () {
  // Upsert del catálogo (idempotente).
  const ops = itemsCatalog.map(i => ({
    updateOne: {
      filter: { itemId: i.itemId },
      update: { $setOnInsert: i },
      upsert: true
    }
  }))
  if (ops.length) await ItemSchema.bulkWrite(ops, { ordered: false }).catch(() => {})
}

async function listShop ({ query = '' } = {}) {
  await ensureCatalog()
  const q = String(query || '').trim()
  const filter = q ? { $or: [{ itemId: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }] } : {}
  return ItemSchema.find(filter).sort({ buyPrice: 1 }).limit(25)
}

async function getItem (itemId) {
  await ensureCatalog()
  return ItemSchema.findOne({ itemId })
}

function normalizeInventory (inv) {
  if (Array.isArray(inv)) return inv
  return []
}

async function addToInventory ({ userID, itemId, qty = 1 }) {
  const q = Math.max(1, Number(qty) || 1)
  const user = await UserSchema.findOneAndUpdate(
    { userID },
    { $setOnInsert: { userID } },
    { upsert: true, new: true }
  )
  const inv = normalizeInventory(user.inventory)
  const idx = inv.findIndex(x => x?.itemId === itemId)
  if (idx === -1) inv.push({ itemId, qty: q })
  else inv[idx].qty = Number(inv[idx].qty || 0) + q
  user.inventory = inv
  await user.save()
  return user
}

async function removeFromInventory ({ userID, itemId, qty = 1 }) {
  const q = Math.max(1, Number(qty) || 1)
  const user = await UserSchema.findOne({ userID })
  if (!user) throw new Error('Inventario vacío.')
  const inv = normalizeInventory(user.inventory)
  const idx = inv.findIndex(x => x?.itemId === itemId)
  if (idx === -1) throw new Error('No tienes ese item.')
  const have = Number(inv[idx].qty || 0)
  if (have < q) throw new Error('Cantidad insuficiente.')
  const left = have - q
  if (left <= 0) inv.splice(idx, 1)
  else inv[idx].qty = left
  user.inventory = inv
  await user.save()
  return user
}

async function buyItem ({ client, guildID, userID, itemId, qty = 1 }) {
  const item = await getItem(itemId)
  if (!item) throw new Error('Item inválido.')
  const q = Math.max(1, Number(qty) || 1)
  const total = Number(item.buyPrice || 0) * q
  if (total <= 0) throw new Error('Este item no está en venta.')

  // Debita wallet atómico.
  const debit = await UserSchema.findOneAndUpdate(
    { userID, money: { $gte: total } },
    { $inc: { money: -total } },
    { new: true }
  )
  if (!debit) throw new Error('Saldo insuficiente.')

  await addToInventory({ userID, itemId, qty: q })
  return { item, qty: q, total }
}

async function sellItem ({ client, guildID, userID, itemId, qty = 1 }) {
  const item = await getItem(itemId)
  if (!item) throw new Error('Item inválido.')
  const q = Math.max(1, Number(qty) || 1)
  const total = Number(item.sellPrice || 0) * q
  if (total <= 0) throw new Error('Este item no se puede vender.')

  await removeFromInventory({ userID, itemId, qty: q })
  await reward({ client, guildID, actorID: userID, userID, amount: total, meta: { type: 'sell_item', itemId, qty: q } })
  return { item, qty: q, total }
}

module.exports = {
  listShop,
  getItem,
  buyItem,
  sellItem,
  addToInventory,
  removeFromInventory
}

