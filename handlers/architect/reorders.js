const { isDeepStrictEqual } = require('node:util')
const { PermissionFlagsBits: F, Routes } = require('discord.js')
const affectedResources = operation => operation.resourceIds || [operation.resourceId]
function projectReorder(snapshot, operation) {
  const projected = structuredClone(snapshot)
  for (const entry of operation.fields.positions) {
    const resource = projected[operation.kind].find(item => item.id === entry.id)
    if (!resource) throw new Error('Reorder resource unavailable')
    resource.position = entry.position
  }
  projected[operation.kind].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  return projected
}
async function applyReorder(guild, operation, reason) {
  const route = operation.kind === 'roles' ? Routes.guildRoles(guild.id) : Routes.guildChannels(guild.id)
  // Manager#setPositions omits reason; use the same SDK REST manager to retain
  // buckets and our audit-tagged protection against ambiguous PATCH replay.
  await guild.client.rest.patch(route, { body: operation.fields.positions.map(({ id, position }) => ({ id, position })), reason })
}
function checkReorders({ guild, observed, blueprint, operations, members }) {
  const checks = [], add = (code, status, detail) => checks.push({ code, status, detail })
  if (!observed?.roles || !observed.channels) return [{ code: 'reorder_snapshot', status: 'unknown', detail: 'Hace falta estructura actual para comprobar el orden.' }]
  const protectedIds = new Set([...(blueprint.protectedIds || []), ...observed.roles.filter(role => role.managed || role.id === guild.id).map(role => role.id), ...observed.channels.filter(channel => ![0, 2, 4].includes(channel.type)).map(channel => channel.id)])
  const bucket = (kind, resource) => kind === 'roles' ? 'roles' : `${resource.type}:${resource.parentId || ''}`
  const positions = resources => resources.map(resource => resource.position).sort((a, b) => a - b)
  for (const operation of operations.filter(item => item.action === 'reorder')) {
    const before = observed[operation.kind], after = projectReorder(observed, operation)[operation.kind]
    let valid = true
    for (const key of new Set(before.map(resource => bucket(operation.kind, resource)))) {
      if (!isDeepStrictEqual(positions(before.filter(resource => bucket(operation.kind, resource) === key)), positions(after.filter(resource => bucket(operation.kind, resource) === key)))) valid = false
    }
    add(`reorder_positions_${operation.kind}`, valid ? 'passed' : 'failed', 'El orden debe intercambiar posiciones existentes dentro del mismo tipo y categoría; no desplaza recursos ajenos.')
    for (const id of operation.resourceIds) {
      const current = before.find(resource => resource.id === id), desired = after.find(resource => resource.id === id)
      const anchors = before.filter(resource => protectedIds.has(resource.id) && bucket(operation.kind, resource) === bucket(operation.kind, current))
      const safe = !protectedIds.has(id) && anchors.every(anchor => Math.sign(current.position - anchor.position) === Math.sign(desired.position - anchor.position))
      add(`reorder_protected_${id}`, safe ? 'passed' : 'failed', 'Los recursos protegidos mantienen su posición y no se atraviesan al cambiar el orden.')
      if (operation.kind === 'roles') {
        for (const [name, member] of Object.entries(members)) {
          const owner = name === 'actor' && member?.id && member.id === guild.ownerId
          const highest = member?.roles?.highest?.position
          add(`reorder_hierarchy_${name}_${id}`, owner ? 'passed' : highest === undefined ? 'unknown' : current.position < highest && desired.position < highest ? 'passed' : 'failed', 'El rol debe permanecer por debajo de OBEY y del administrador antes y después del cambio de orden.')
        }
      } else {
        for (const [name, member] of Object.entries(members)) {
          let allowed
          try {
            const permissions = guild.channels?.cache?.get(id)?.permissionsFor(member)
            const exempt = member?.permissions?.has(F.Administrator, false) || (member?.id && member.id === guild.ownerId)
            const timedOut = !exempt && (member?.isCommunicationDisabled?.() || member?.communicationDisabledUntilTimestamp > Date.now())
            allowed = member && !timedOut && permissions?.has(current.type === 2 ? [F.ViewChannel, F.ManageChannels, F.Connect] : [F.ViewChannel, F.ManageChannels])
          } catch {}
          add(`${name}_reorder_${id}`, allowed === undefined ? 'unknown' : allowed ? 'passed' : 'failed', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} necesita acceso efectivo para ordenar este recurso.`)
        }
      }
    }
  }
  return checks
}
module.exports = { affectedResources, projectReorder, applyReorder, checkReorders }
