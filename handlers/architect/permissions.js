const { PermissionFlagsBits: F, PermissionsBitField } = require('discord.js')
function permissionCalculator(snapshot, member, ownerId) {
  if (!member?.id) throw new Error('Unknown member')
  if (member.id === ownerId) return () => new PermissionsBitField(PermissionsBitField.All)
  const cache = member.roles?.cache
  if (!cache?.keys || !cache.has(snapshot.guildId)) throw new Error('Unknown role membership')
  const held = new Set(cache.keys()), byId = new Map(snapshot.roles.map(role => [role.id, role]))
  let base = 0n
  for (const id of held) {
    if (!byId.has(id)) throw new Error('Unknown role membership')
    base |= BigInt(byId.get(id).permissions)
  }
  return channel => {
    let value = base
    if (value & F.Administrator) value = PermissionsBitField.All
    else if (channel) {
      const overwrites = channel.overwrites || []
      const apply = overwrite => { if (overwrite) value = (value & ~BigInt(overwrite.deny)) | BigInt(overwrite.allow) }
      apply(overwrites.find(overwrite => overwrite.type === 0 && overwrite.id === snapshot.guildId))
      let allow = 0n, deny = 0n
      for (const overwrite of overwrites) {
        if (overwrite.type !== 0 || overwrite.id === snapshot.guildId || !held.has(overwrite.id)) continue
        allow |= BigInt(overwrite.allow); deny |= BigInt(overwrite.deny)
      }
      value = (value & ~deny) | allow
      apply(overwrites.find(overwrite => overwrite.type === 1 && overwrite.id === member.id))
    }
    if (channel && (member.isCommunicationDisabled?.() || member.communicationDisabledUntilTimestamp > Date.now())) value &= F.ViewChannel | F.ReadMessageHistory
    return new PermissionsBitField(value)
  }
}
function projectedPermissions(snapshot, member, ownerId, channel) {
  return permissionCalculator(snapshot, member, ownerId)(channel)
}
function checkPermissionPlan({ snapshot, operations, members, ownerId, idMap = {} }) {
  if (!snapshot?.roles || !snapshot.channels) throw new Error('Unknown permission snapshot')
  const state = structuredClone(snapshot), checks = []
  const administrative = F.ManageGuild | F.ManageRoles | F.ManageChannels | F.ViewAuditLog
  const channelManagement = F.ViewChannel | F.ManageChannels | F.ManageRoles
  const baseline = Object.entries(members).map(([name, member]) => {
    const permissions = permissionCalculator(state, member, ownerId)
    return { name, member, guild: permissions().bitfield & administrative,
      channels: new Map(state.channels.map(channel => [channel.id, permissions(channel).bitfield & channelManagement])) }
  })
  const resolve = id => idMap[id] || id
  for (const operation of operations) {
    const id = resolve(operation.resourceId), list = state[operation.kind]
    const target = list.find(resource => resource.id === id)
    if (operation.action === 'create') {
      if (!target) list.push({ ...structuredClone(operation.fields), id })
      continue
    }
    if (operation.action !== 'permissions') continue
    if (!target) throw new Error('Unknown permission resource')
    if (operation.cascadeIds) require('./cascades').projectCategoryPermissions(state, operation, idMap)
    else {
      Object.assign(target, structuredClone(operation.fields))
      if (operation.kind === 'channels') target.overwrites = target.overwrites.map(overwrite => ({ ...overwrite, id: resolve(overwrite.id) }))
    }
    for (const original of baseline) {
      const permissions = permissionCalculator(state, original.member, ownerId), current = permissions()
      let allowed = current.has(original.guild) && (original.name !== 'actor' || current.has(F.ManageGuild))
      for (const channel of state.channels) {
        const affected = operation.resourceIds || [id]
        const required = (original.channels.get(channel.id) || 0n) | (operation.kind === 'channels' && affected.includes(channel.id) ? channelManagement | (operation.cascadeIds && channel.type === 2 ? F.Connect : 0n) : 0n)
        if (required && !permissions(channel).has(required)) allowed = false
      }
      checks.push({ code: `${original.name}_access_${operation.id}`, status: allowed ? 'passed' : 'failed',
        detail: `${original.name === 'bot' ? 'OBEY' : 'Tu cuenta'} debe conservar acceso y permisos administrativos después de cada cambio de permisos.` })
    }
  }
  return checks
}
module.exports = { projectedPermissions, checkPermissionPlan }
