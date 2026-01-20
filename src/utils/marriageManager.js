// Gestor de propuestas de matrimonio
const pendingProposals = new Map()

async function proposeMarriage (proposerId, targetId, db) {
  if (proposerId === targetId) return { ok: false, message: 'No puedes casarte contigo mismo.' }

  const proposerData = await db.getUserData(proposerId)
  const targetData = await db.getUserData(targetId)

  if (proposerData.partner) return { ok: false, message: 'Ya estás casado.' }
  if (targetData.partner) return { ok: false, message: 'Esa persona ya está casada.' }

  pendingProposals.set(targetId, proposerId)
  return { ok: true }
}

async function acceptMarriage (userId, db) {
  const proposerId = pendingProposals.get(userId)
  if (!proposerId) return { ok: false }

  const proposerData = await db.getUserData(proposerId)
  const userData = await db.getUserData(userId)

  if (proposerData.partner || userData.partner) {
    pendingProposals.delete(userId)
    return { ok: false, message: 'Uno de los dos ya no está soltero.' }
  }

  proposerData.partner = userId
  userData.partner = proposerId

  await proposerData.save()
  await userData.save()

  pendingProposals.delete(userId)
  return { ok: true, proposerId }
}

function rejectMarriage (userId) {
  if (!pendingProposals.has(userId)) return false
  pendingProposals.delete(userId)
  return true
}

async function divorce (userId, db) {
  const userData = await db.getUserData(userId)
  const partnerId = userData.partner
  if (!partnerId) return false

  const partnerData = await db.getUserData(partnerId)

  userData.partner = null
  partnerData.partner = null

  await userData.save()
  await partnerData.save()

  return true
}

module.exports = {
  proposeMarriage,
  acceptMarriage,
  rejectMarriage,
  divorce,
  hasPending: (userId) => pendingProposals.has(userId),
  getProposer: (userId) => pendingProposals.get(userId)
}
