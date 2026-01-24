const UserSchema = require('../../database/schemas/UserSchema')
const ItemSchema = require('../../database/schemas/ItemSchema')
const itemsCatalog = require('./itemsCatalog')
const { tryDebitWallet, creditWallet } = require('../economy/economyService')

function norm (v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const NAME_TO_ID = (() => {
  const m = new Map()
  for (const it of (Array.isArray(itemsCatalog) ? itemsCatalog : [])) {
    if (!it?.itemId) continue
    m.set(norm(it.itemId), it.itemId)
    if (it.name) m.set(norm(it.name), it.itemId)
  }
  return m
})()

async function ensureCatalog () {
  const ops = (Array.isArray(itemsCatalog) ? itemsCatalog : []).map(i => ({
    updateOne: {
      filter: { itemId: i.itemId },
      update: {
        $setOnInsert: { itemId: i.itemId },
        $set: {
          name: i.name,
          description: i.description || '',
          type: i.type || 'consumable',
          buyPrice: Number(i.buyPrice || 0),
          sellPrice: Number(i.sellPrice || 0),
          meta: i.meta || {}
        }
      },
      upsert: true
    }
  }))
  if (ops.length) await ItemSchema.bulkWrite(ops, { ordered: false }).catch(() => {})
}

function normalizeInventoryArray (inv) {
  const raw = Array.isArray(inv) ? inv : []
  const keep = []
  const counts = new Map()
  let changed = false

  for (const entry of raw) {
    if (!entry) continue

    if (typeof entry === 'string') {
      const mapped = NAME_TO_ID.get(norm(entry))
      if (mapped) {
        counts.set(mapped, (counts.get(mapped) || 0) + 1)
        changed = true
      } else {
        keep.push(entry)
      }
      continue
    }

    if (typeof entry === 'object') {
      const itemId = entry.itemId ? String(entry.itemId) : null
      if (itemId) {
        const q = Math.max(1, Number(entry.qty) || 1)
        counts.set(itemId, (counts.get(itemId) || 0) + q)
        continue
      }
    }

    keep.push(entry)
  }

  const out = [...counts.entries()].map(([itemId, qty]) => ({ itemId, qty }))
  if (keep.length) out.push(...keep)
  return { inventory: out, changed }
}

async function ensureUserDoc (userID) {
  return UserSchema.findOneAndUpdate(
    { userID },
    { $setOnInsert: { userID } },
    { upsert: true, new: true }
  )
}

async function getUserInventory ({ userID, migrate = true } = {}) {
  const user = await ensureUserDoc(userID)
  if (!migrate) return Array.isArray(user.inventory) ? user.inventory : []

  const { inventory, changed } = normalizeInventoryArray(user.inventory)
  if (changed) {
    user.inventory = inventory
    await user.save()
  }
  return inventory
}

async function listShop ({ query = '' } = {}) {
  await ensureCatalog()
  const q = String(query || '').trim()
  const filter = q
    ? { $or: [{ itemId: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }] }
    : {}
  return ItemSchema.find(filter).sort({ buyPrice: 1 }).limit(25)
}

async function getItemsByIds (itemIds) {
  await ensureCatalog()
  const ids = [...new Set((Array.isArray(itemIds) ? itemIds : []).filter(Boolean).map(String))]
  if (!ids.length) return []
  return ItemSchema.find({ itemId: { $in: ids } })
}

async function getItem (itemId) {
  await ensureCatalog()
  return ItemSchema.findOne({ itemId })
}

async function addToInventory ({ userID, itemId, qty = 1 }) {
  const q = Math.max(1, Number(qty) || 1)
  const user = await ensureUserDoc(userID)
  const { inventory } = normalizeInventoryArray(user.inventory)

  const inv = Array.isArray(inventory) ? inventory : []
  const idx = inv.findIndex(x => x && typeof x === 'object' && x.itemId === itemId)
  if (idx === -1) inv.push({ itemId, qty: q })
  else inv[idx].qty = Number(inv[idx].qty || 0) + q

  user.inventory = inv
  await user.save()
  return user
}

async function removeFromInventory ({ userID, itemId, qty = 1 }) {
  const q = Math.max(1, Number(qty) || 1)
  const user = await ensureUserDoc(userID)
  const { inventory } = normalizeInventoryArray(user.inventory)

  const inv = Array.isArray(inventory) ? inventory : []
  const idx = inv.findIndex(x => x && typeof x === 'object' && x.itemId === itemId)
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
  if (!item) throw new Error('Item invalido.')

  const q = Math.max(1, Number(qty) || 1)
  const total = Number(item.buyPrice || 0) * q
  if (total <= 0) throw new Error('Este item no esta en venta.')

  await tryDebitWallet({
    client,
    guildID,
    actorID: userID,
    userID,
    amount: total,
    type: 'buy_item',
    meta: { itemId, qty: q }
  })

  await addToInventory({ userID, itemId, qty: q })
  return { item, qty: q, total }
}

async function sellItem ({ client, guildID, userID, itemId, qty = 1 }) {
  const item = await getItem(itemId)
  if (!item) throw new Error('Item invalido.')

  const q = Math.max(1, Number(qty) || 1)
  const total = Number(item.sellPrice || 0) * q
  if (total <= 0) throw new Error('Este item no se puede vender.')

  await removeFromInventory({ userID, itemId, qty: q })
  await creditWallet({
    client,
    guildID,
    actorID: userID,
    userID,
    amount: total,
    type: 'sell_item',
    meta: { itemId, qty: q }
  })

  return { item, qty: q, total }
}

async function giveItem ({ fromUserID, toUserID, itemId, qty = 1 }) {
  if (fromUserID === toUserID) throw new Error('No puedes darte items a ti mismo.')
  const item = await getItem(itemId)
  if (!item) throw new Error('Item invalido.')

  const q = Math.max(1, Number(qty) || 1)
  await removeFromInventory({ userID: fromUserID, itemId, qty: q })
  await addToInventory({ userID: toUserID, itemId, qty: q })
  return { item, qty: q }
}

module.exports = {
  listShop,
  getItem,
  getItemsByIds,
  getUserInventory,
  buyItem,
  sellItem,
  addToInventory,
  removeFromInventory,
  giveItem
}
