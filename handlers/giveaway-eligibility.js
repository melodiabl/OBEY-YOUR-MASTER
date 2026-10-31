const validId = id => typeof id === 'string' && /^\d{17,20}$/.test(id)
const fail = code => { throw Object.assign(new Error(code), { code }) }

function parseBonusEntries(content, roleIds) {
  if (typeof content === 'string' && Array.isArray(roleIds) && roleIds.length === 0 && /^(?:no|0)$/i.test(content.trim())) return []
  if (typeof content !== 'string' || content.length > 2000 || !Array.isArray(roleIds) || !roleIds.length || roleIds.length > 25) fail('giveaway_invalid_bonus')
  const seen = new Set()
  return content.split(',').map(part => {
    const match = part.trim().match(/^<@&(\d{17,20})>(?:\s+([1-9]\d{0,6}))?$/)
    const roleId = match?.[1], amount = Number(match?.[2] || 1)
    if (!validId(roleId) || !roleIds.includes(roleId) || seen.has(roleId) || amount > 1000000) fail('giveaway_invalid_bonus')
    seen.add(roleId)
    return { roleId, amount }
  })
}

// These functions are serialized by discord-giveaways. All variable data lives
// in persisted extraData, never in generated JavaScript or a captured closure.
function bonusForRoles(member, giveaway) {
  const rules = giveaway?.extraData?.obeyRoleEligibility?.bonus || []
  let total = 0
  for (const rule of rules) {
    if (member?.roles?.cache?.has(rule.roleId) && Number.isSafeInteger(rule.amount) && rule.amount > 0 && rule.amount <= 1000000) total += rule.amount
  }
  return total || null
}
const exemptWithoutRequiredRole = (member, giveaway) => {
  const roles = giveaway?.extraData?.obeyRoleEligibility?.required || []
  return roles.length > 0 && !roles.some(id => member?.roles?.cache?.has(id))
}

function eligibilityOptions(bonus = [], required = []) {
  if (!Array.isArray(bonus) || bonus.length > 25 || bonus.some(rule => !validId(rule?.roleId) || !Number.isSafeInteger(rule.amount) || rule.amount < 1 || rule.amount > 1000000) || new Set(bonus.map(rule => rule.roleId)).size !== bonus.length) fail('giveaway_invalid_bonus')
  if (!Array.isArray(required) || required.length > 25 || required.some(id => !validId(id)) || new Set(required).size !== required.length) fail('giveaway_invalid_role')
  return {
    extraData: { obeyRoleEligibility: { version: 1, bonus: bonus.map(rule => ({ roleId: rule.roleId, amount: rule.amount })), required: [...required] } },
    bonusEntries: bonus.length ? [{ bonus: bonusForRoles, cumulative: true }] : [],
    exemptMembers: required.length ? exemptWithoutRequiredRole : undefined
  }
}
module.exports = { parseBonusEntries, eligibilityOptions }
