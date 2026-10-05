const { isDeepStrictEqual } = require('node:util')
const { AuditLogEvent } = require('discord.js')
const guarded = new WeakSet()
const reasonFor = (jobId, operation) => `OBEY Architect ${jobId} / ${operation.id}`
function supportedCreation(kind, resource) {
  if (!resource || !/^local:[a-zA-Z0-9_-]{1,64}$/.test(resource.id)) return false
  if (kind === 'roles') return resource.position === 1 && resource.permissions === '0' && resource.managed === false
  if (kind !== 'channels' || resource.position !== 0 || resource.overwrites?.length !== 0) return false
  if (resource.type === 4) return resource.parentId === null && resource.topic === '' && !resource.nsfw && resource.bitrate === null && resource.userLimit === null && resource.rateLimitPerUser === 0
  if (resource.type === 0) return resource.bitrate === null && resource.userLimit === null
  return resource.type === 2 && resource.topic === '' && Number.isInteger(resource.bitrate) && Number.isInteger(resource.userLimit)
}
function creationOptions(operation, idMap, reason) {
  const resource = operation.fields
  if (operation.kind === 'roles') return { name: resource.name, permissions: BigInt(resource.permissions), colors: { primaryColor: resource.color }, hoist: resource.hoist, mentionable: resource.mentionable, reason }
  const parent = resource.parentId?.startsWith('local:') ? idMap[resource.parentId] : resource.parentId
  if (resource.parentId && !parent) throw new Error('Missing category mapping')
  const options = { name: resource.name, type: resource.type, parent, permissionOverwrites: [], reason }
  if (resource.type !== 4) Object.assign(options, { nsfw: resource.nsfw, rateLimitPerUser: resource.rateLimitPerUser })
  if (resource.type === 0) options.topic = resource.topic
  if (resource.type === 2) Object.assign(options, { bitrate: resource.bitrate, userLimit: resource.userLimit })
  // Position is deliberately omitted: RoleManager would make a second mutation.
  return options
}
function installArchitectRetryGuard(rest) {
  if (!rest?.options || typeof rest.options.makeRequest !== 'function') throw new Error('Creation transport unavailable')
  if (guarded.has(rest)) return
  const request = rest.options.makeRequest
  rest.options.makeRequest = async (url, options) => {
    const reason = options.headers?.['X-Audit-Log-Reason']
    const creation = options.method === 'POST' && /\/guilds\/\d+\/(?:roles|channels)(?:\?|$)/.test(String(url))
    const edit = options.method === 'PATCH' && /\/(?:channels\/\d+|guilds\/\d+\/roles\/\d+|guilds\/\d+\/(?:roles|channels))(?:\?|$)/.test(String(url))
    if ((!creation && !edit) || typeof reason !== 'string' || !reason.startsWith('OBEY%20Architect%20')) return request(url, options)
    // Keep the SDK's shared rate buckets and definitive 429 handling. Hide retryable
    // network error codes and throw before its automatic 5xx replay can duplicate POST.
    try {
      const response = await request(url, options)
      if (response.status >= 500) throw new Error('Creation outcome uncertain')
      return response
    } catch { throw new Error('Creation outcome uncertain') }
  }
  guarded.add(rest)
}
function stableResources(before, after, normalizePosition) {
  if (before.length !== after.length) return false
  const byId = new Map(after.map(resource => [resource.id, resource]))
  for (const resource of before) {
    const actual = byId.get(resource.id)
    if (!actual || !isDeepStrictEqual(resource, normalizePosition ? { ...actual, position: resource.position } : actual)) return false
  }
  if (!normalizePosition) return true
  const order = resources => resources.slice().sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).map(resource => resource.id)
  // Discord may renumber positions, but existing resources must retain their order.
  for (const type of new Set(before.map(resource => resource.type))) {
    if (!isDeepStrictEqual(order(before.filter(resource => resource.type === type)), order(after.filter(resource => resource.type === type)))) return false
  }
  return true
}
function verifyCreation(before, after, operation, realId, idMap) {
  if (!/^\d{17,20}$/.test(realId || '') || [...before.roles, ...before.channels].some(resource => resource.id === realId)) return false
  const target = after[operation.kind].find(resource => resource.id === realId)
  if (!target || after[operation.kind].length !== before[operation.kind].length + 1) return false
  const desired = { ...operation.fields, id: realId, position: target.position }
  if (operation.kind === 'channels' && desired.parentId?.startsWith('local:')) desired.parentId = idMap[desired.parentId]
  if (!isDeepStrictEqual(target, desired)) return false
  if (operation.kind === 'roles' && (target.position !== 1 || after.roles.some(role => role.id !== realId && role.position !== 0 && role.position <= 1))) return false
  for (const kind of ['channels', 'roles']) {
    if (!stableResources(before[kind], after[kind].filter(resource => resource.id !== realId), kind === operation.kind)) return false
  }
  const colors = { ...(after.roleColors || {}) }
  if (operation.kind === 'roles') {
    if (!isDeepStrictEqual(colors[realId], { primaryColor: desired.color, secondaryColor: null, tertiaryColor: null })) return false
    delete colors[realId]
  }
  return isDeepStrictEqual(before.roleColors || {}, colors)
}
async function reconcileCreation(guild, operation, jobId) {
  if (!guild.client?.user?.id || !guild.fetchAuditLogs) return null
  try {
    const type = operation.kind === 'roles' ? AuditLogEvent.RoleCreate : AuditLogEvent.ChannelCreate
    const logs = await guild.fetchAuditLogs({ type, user: guild.client.user.id, limit: 100 })
    const matches = [...logs.entries.values()].filter(entry => entry.action === type && entry.executorId === guild.client.user.id && entry.reason === reasonFor(jobId, operation))
    return matches.length === 1 && /^\d{17,20}$/.test(matches[0].targetId || '') ? matches[0].targetId : null
  } catch { return null }
}
module.exports = { supportedCreation, creationOptions, installArchitectRetryGuard, verifyCreation, reconcileCreation, reasonFor }
