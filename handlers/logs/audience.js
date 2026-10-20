const { PermissionFlagsBits: F } = require('discord.js')
const BASE_VIEW = Symbol('base view permission')
const empty = new Set()
const always = { any: null, none: empty }
const forceView = overwrite => overwrite?.allow?.has(F.ViewChannel, false) ? true : overwrite?.deny?.has(F.ViewChannel, false) ? false : undefined

function viewRules(channel, guild) {
  const overwrites = channel.permissionOverwrites?.cache
  if (!overwrites || !guild.roles?.cache || !guild.roles.everyone) return null
  let constant = Boolean(guild.roles.everyone.permissions?.has(F.ViewChannel))
  // The same base-view variable is shared by both channels. This also covers a
  // role not yet cached, instead of assuming that unobserved members cannot view.
  const base = new Set([BASE_VIEW])
  for (const role of guild.roles.cache.values()) if (role.id !== guild.id && role.permissions?.has(F.ViewChannel)) base.add(role.id)
  const everyone = overwrites.get(guild.id), forced = forceView(everyone)
  if (forced !== undefined) { constant = forced; base.clear() }
  if (constant) base.clear()
  const allow = new Set(), deny = new Set(), members = new Map()
  for (const overwrite of overwrites.values()) {
    if (overwrite.type !== 0 && overwrite.type !== 1 || overwrite.id === guild.id && overwrite.type !== 0) return null
    if (overwrite.id === guild.id) continue
    if (overwrite.type === 1) {
      const value = forceView(overwrite)
      if (value !== undefined) members.set(overwrite.id, value)
    } else {
      if (overwrite.allow.has(F.ViewChannel, false)) allow.add(overwrite.id)
      if (overwrite.deny.has(F.ViewChannel, false)) deny.add(overwrite.id)
    }
  }
  return { constant, base, allow, deny, members }
}
function visible(rules, forced) {
  if (forced !== undefined) return forced ? [always] : []
  return [...(rules.allow.size ? [{ any: rules.allow, none: empty }] : []),
    ...(rules.constant || rules.base.size ? [{ any: rules.constant ? null : rules.base, none: rules.deny }] : [])]
}
function hidden(rules, forced) {
  if (forced !== undefined) return forced ? [] : [always]
  return [...(rules.deny.size ? [{ any: rules.deny, none: rules.allow }] : []),
    ...(!rules.constant ? [{ any: null, none: new Set([...rules.allow, ...rules.base]) }] : [])]
}
function overlaps(first, second) {
  const forbidden = new Set([...first.none, ...second.none])
  return [first.any, second.any].every(roles => roles === null || [...roles].some(id => !forbidden.has(id)))
}

// Prove there is no combination that can view the destination but not the
// source. Checking roles individually is insufficient: a role allow overrides
// other role denies, and a member overwrite runs after both.
function audienceFits(source, destination, guild) {
  const origin = viewRules(source, guild), target = viewRules(destination, guild)
  if (!origin || !target) return false
  const identities = new Set([undefined, ...origin.members.keys(), ...target.members.keys()])
  for (const id of identities) {
    const readers = visible(target, target.members.get(id)), excluded = hidden(origin, origin.members.get(id))
    if (readers.some(reader => excluded.some(nonReader => overlaps(reader, nonReader)))) return false
  }
  return true
}
module.exports = { audienceFits }
