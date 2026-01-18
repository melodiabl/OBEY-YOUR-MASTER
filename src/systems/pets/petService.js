const UserSchema = require('../../database/schemas/UserSchema')
const { tryDebitWallet } = require('../economy/economyService')

const PET_TYPES = Object.freeze([
  'cat',
  'dog',
  'fox',
  'panda',
  'bunny',
  'capybara'
])

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function normalizePet (pet) {
  if (!pet || typeof pet !== 'object') pet = {}
  return {
    name: pet.name || null,
    type: pet.type || null,
    health: clamp(pet.health ?? 100, 0, 100),
    happiness: clamp(pet.happiness ?? 50, 0, 100),
    level: clamp(pet.level ?? 1, 1, 999),
    xp: clamp(pet.xp ?? 0, 0, 1_000_000_000),
    lastFed: pet.lastFed ? new Date(pet.lastFed) : new Date(),
    lastPlayedAt: Number(pet.lastPlayedAt || 0),
    createdAt: pet.createdAt ? new Date(pet.createdAt) : new Date()
  }
}

async function getUser ({ client, userID }) {
  return client.db.getUserData(userID)
}

async function getPet ({ client, userID }) {
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  return { user, pet, hasPet: Boolean(pet.type) }
}

async function adoptPet ({ client, userID, type, name }) {
  const t = String(type || '').toLowerCase()
  if (!PET_TYPES.includes(t)) throw new Error(`Tipo inválido. Opciones: ${PET_TYPES.join(', ')}`)
  const n = String(name || '').trim()
  if (n.length < 2 || n.length > 20) throw new Error('Nombre inválido (2-20).')

  const user = await getUser({ client, userID })
  const current = normalizePet(user.pet)
  if (current.type) throw new Error('Ya tienes una mascota. Usa `/pets abandon` primero.')

  user.pet = {
    name: n,
    type: t,
    health: 100,
    happiness: 50,
    level: 1,
    xp: 0,
    lastFed: new Date(),
    lastPlayedAt: 0,
    createdAt: new Date()
  }
  user.markModified('pet')
  await user.save()
  return normalizePet(user.pet)
}

async function abandonPet ({ client, userID }) {
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  if (!pet.type) throw new Error('No tienes mascota.')
  user.pet = { name: null, type: null, health: 100, happiness: 50, level: 1, xp: 0, lastFed: new Date(), lastPlayedAt: 0, createdAt: new Date() }
  user.markModified('pet')
  await user.save()
  return true
}

async function feedPet ({ client, guildID, userID }) {
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  if (!pet.type) throw new Error('No tienes mascota.')

  const now = Date.now()
  const last = pet.lastFed ? new Date(pet.lastFed).getTime() : 0
  const cd = 60 * 60 * 1000
  if (now - last < cd) {
    const mins = Math.ceil((cd - (now - last)) / 60000)
    throw new Error(`Debes esperar ${mins} min para volver a alimentar.`)
  }

  pet.health = clamp(pet.health + 15, 0, 100)
  pet.happiness = clamp(pet.happiness + 5, 0, 100)
  pet.xp = pet.xp + 10
  pet.lastFed = new Date()

  // Level up simple.
  const needed = pet.level * pet.level * 50
  if (pet.xp >= needed) {
    pet.level += 1
    pet.xp = 0
  }

  user.pet = pet
  user.markModified('pet')
  await user.save()
  return pet
}

async function playWithPet ({ client, userID }) {
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  if (!pet.type) throw new Error('No tienes mascota.')

  const now = Date.now()
  const cd = 15 * 60_000
  if (now - Number(pet.lastPlayedAt || 0) < cd) {
    const mins = Math.ceil((cd - (now - Number(pet.lastPlayedAt || 0))) / 60000)
    throw new Error(`Debes esperar ${mins} min para volver a jugar.`)
  }

  pet.lastPlayedAt = now
  pet.happiness = clamp(pet.happiness + 10, 0, 100)
  pet.xp = pet.xp + 8
  const needed = pet.level * pet.level * 50
  if (pet.xp >= needed) {
    pet.level += 1
    pet.xp = 0
  }
  user.pet = pet
  user.markModified('pet')
  await user.save()
  return pet
}

async function renamePet ({ client, userID, name }) {
  const n = String(name || '').trim()
  if (n.length < 2 || n.length > 20) throw new Error('Nombre inválido (2-20).')
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  if (!pet.type) throw new Error('No tienes mascota.')
  pet.name = n
  user.pet = pet
  user.markModified('pet')
  await user.save()
  return pet
}

async function healPet ({ client, guildID, userID }) {
  const user = await getUser({ client, userID })
  const pet = normalizePet(user.pet)
  if (!pet.type) throw new Error('No tienes mascota.')
  if (pet.health >= 100) throw new Error('Tu mascota ya está al máximo.')

  const price = 250
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: price, type: 'pet_heal', meta: {} })
  pet.health = 100
  user.pet = pet
  user.markModified('pet')
  await user.save()
  return { pet, price }
}

module.exports = {
  PET_TYPES,
  getPet,
  adoptPet,
  abandonPet,
  feedPet,
  playWithPet,
  renamePet,
  healPet
}
