// Gestor de propuestas de matrimonio
const pendingProposals = new Map()

function propose (proposerId, targetId) {
  pendingProposals.set(targetId, proposerId)
}

function hasPending (userId) {
  return pendingProposals.has(userId)
}

function getProposer (userId) {
  return pendingProposals.get(userId)
}

function accept (userId) {
  const proposerId = pendingProposals.get(userId)
  pendingProposals.delete(userId)
  return proposerId
}

function reject (userId) {
  pendingProposals.delete(userId)
}

module.exports = {
  propose,
  hasPending,
  getProposer,
  accept,
  reject
}
