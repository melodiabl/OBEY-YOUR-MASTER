const { isDeepStrictEqual } = require('node:util')
class BlueprintError extends Error {
  constructor(message, code = 'invalid_blueprint') { super(message); this.code = code }
}
function fail(message, code) { throw new BlueprintError(message, code) }
function object(value, fields, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`Invalid ${label}`)
  for (const key of Object.keys(value)) if (!fields.includes(key)) fail(`Unknown ${label} field: ${key}`)
}
function number(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`Invalid ${label}`)
  return value
}
function name(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 100) fail('Invalid resource name')
  return value
}
function boolean(value, label) {
  if (value !== undefined && typeof value !== 'boolean') fail(`Invalid ${label}`)
  return value ?? false
}
function bits(value) {
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value) || BigInt(value) > (1n << 64n) - 1n) fail('Invalid permissions')
  return BigInt(value).toString()
}
function list(value, label) {
  if (!Array.isArray(value) || value.length > 500) fail(`Invalid ${label} list`)
  return value
}
const channelFields = ['id', 'name', 'type', 'parentId', 'position', 'topic', 'nsfw', 'bitrate', 'userLimit', 'rateLimitPerUser', 'overwrites']
const roleFields = ['id', 'name', 'position', 'permissions', 'color', 'hoist', 'mentionable', 'managed']
function validateBlueprint(input, source) {
  object(input, ['schemaVersion', 'baseRevision', 'channels', 'roles', 'protectedIds'], 'blueprint')
  if (input.schemaVersion !== undefined && input.schemaVersion !== 1) fail('Unsupported blueprint version')
  if (input.baseRevision !== source.revision) fail('Snapshot revision changed', 'revision_conflict')
  const allIds = new Set(), existing = new Map([...source.channels, ...source.roles].map(resource => [resource.id, resource]))
  const identity = resource => {
    if (typeof resource.id !== 'string' || allIds.has(resource.id)) fail('Invalid or duplicate resource ID')
    if (!existing.has(resource.id) && !/^local:[a-zA-Z0-9_-]{1,64}$/.test(resource.id)) fail('New resources require a logical ID')
    allIds.add(resource.id)
  }
  const roles = list(input.roles, 'roles').map(role => {
    object(role, roleFields, 'role'); identity(role)
    const previous = source.roles.find(item => item.id === role.id)
    if (existing.has(role.id) && !previous) fail('Resource kind cannot change')
    const result = { id: role.id, name: name(role.name), position: number(role.position, 0, 500, 'role position'),
      permissions: bits(role.permissions), color: number(role.color ?? 0, 0, 0xffffff, 'role color'),
      hoist: boolean(role.hoist, 'hoist'), mentionable: boolean(role.mentionable, 'mentionable'), managed: boolean(role.managed, 'managed') }
    if (result.managed && !previous?.managed) fail('Cannot create a managed role')
    return result
  })
  const roleIds = new Set(roles.map(role => role.id))
  const channels = list(input.channels, 'channels').map(channel => {
    object(channel, channelFields, 'channel'); identity(channel)
    const previous = source.channels.find(item => item.id === channel.id)
    if (existing.has(channel.id) && !previous) fail('Resource kind cannot change')
    if (previous && channel.type !== previous.type) fail('Existing channel type cannot change')
    if (previous && ![0, 2, 4].includes(previous.type)) {
      if (!isDeepStrictEqual(channel, previous)) fail('Protected resource changed')
      return structuredClone(previous)
    }
    if (!previous && ![0, 2, 4].includes(channel.type)) fail('Unsupported new channel type')
    if (typeof (channel.topic ?? '') !== 'string' || (channel.topic ?? '').length > 1024) fail('Invalid channel topic')
    if (channel.parentId !== null && typeof channel.parentId !== 'string') fail('Invalid parent')
    const overwrites = list(channel.overwrites, 'overwrites').map(overwrite => {
      object(overwrite, ['id', 'type', 'allow', 'deny'], 'overwrite')
      if (typeof overwrite.id !== 'string' || ![0, 1].includes(overwrite.type)) fail('Invalid overwrite target')
      if (overwrite.type === 0 && !roleIds.has(overwrite.id)) fail('Unknown overwrite role')
      if (overwrite.type === 1 && !previous?.overwrites.some(old => old.type === 1 && old.id === overwrite.id)) fail('New member overwrites are not supported')
      const result = { id: overwrite.id, type: overwrite.type, allow: bits(overwrite.allow), deny: bits(overwrite.deny) }
      if (BigInt(result.allow) & BigInt(result.deny)) fail('Conflicting overwrite permissions')
      return result
    }).sort((a, b) => a.id.localeCompare(b.id))
    if (new Set(overwrites.map(item => item.id)).size !== overwrites.length) fail('Duplicate overwrite target')
    return { id: channel.id, name: name(channel.name), type: channel.type, parentId: channel.parentId,
      position: number(channel.position, 0, 500, 'channel position'), topic: channel.topic ?? '', nsfw: boolean(channel.nsfw, 'nsfw'),
      bitrate: channel.bitrate == null ? null : number(channel.bitrate, 8000, 384000, 'bitrate'),
      userLimit: channel.userLimit == null ? null : number(channel.userLimit, 0, 99, 'user limit'),
      rateLimitPerUser: number(channel.rateLimitPerUser ?? 0, 0, 21600, 'slowmode'), overwrites }
  })
  const byChannel = new Map(channels.map(channel => [channel.id, channel]))
  for (const channel of channels) {
    if (channel.type === 4 && channel.parentId !== null) fail('Categories cannot have a parent')
    if (channel.parentId && byChannel.get(channel.parentId)?.type !== 4) fail('Invalid channel parent')
  }
  for (const resource of [...source.channels, ...source.roles]) if (!allIds.has(resource.id)) fail('Cannot omit existing resources; deletion needs a separate explicit workflow')
  const protectedIds = input.protectedIds ?? []
  if (!Array.isArray(protectedIds) || protectedIds.some(id => !existing.has(id))) fail('Invalid protected resources')
  const automatic = source.roles.filter(role => role.managed || role.id === source.guildId).map(role => role.id)
  const protectedSet = new Set([...protectedIds, ...automatic, ...source.channels.filter(channel => ![0, 2, 4].includes(channel.type)).map(channel => channel.id)])
  for (const resource of [...channels, ...roles]) {
    if (protectedSet.has(resource.id) && !isDeepStrictEqual(resource, existing.get(resource.id))) fail('Protected resource changed')
  }
  const order = (a, b) => a.position - b.position || a.id.localeCompare(b.id)
  return { schemaVersion: 1, baseRevision: source.revision, channels: channels.sort(order), roles: roles.sort(order), protectedIds: [...new Set(protectedIds)].sort() }
}
module.exports = { validateBlueprint, BlueprintError }
