const { isDeepStrictEqual } = require('node:util')
const { PermissionFlagsBits: F } = require('discord.js')
function checkChannelMoves({ guild, observed, operations, members, idMap = {} }) {
  if (!Array.isArray(observed?.channels)) return [{ code: 'move_snapshot', status: 'unknown', detail: 'Hace falta estructura actual para verificar los movimientos.' }]
  const channels = structuredClone(observed.channels), checks = []
  const resolve = id => idMap[id] || id
  const add = (code, status, detail) => checks.push({ code, status, detail })
  for (const operation of operations) {
    if (operation.kind !== 'channels') continue
    const id = resolve(operation.resourceId)
    if (operation.action === 'create') {
      if (!channels.some(channel => channel.id === id)) channels.push({ ...structuredClone(operation.fields), id, parentId: resolve(operation.fields.parentId) })
    } else if (operation.action === 'move') {
      const current = channels.find(channel => channel.id === id), parentId = resolve(operation.fields.parentId)
      const parent = parentId == null ? null : channels.find(channel => channel.id === parentId)
      if (!current || (parentId != null && parent?.type !== 4)) { add(`move_resource_${id}`, 'unknown', 'No se pudo verificar el canal o la categoría de destino.'); continue }
      if (current.parentId !== parentId) add(`move_privacy_${id}`, !parent || isDeepStrictEqual(current.overwrites, parent.overwrites) ? 'passed' : 'failed', 'El canal conservará sus permisos. La categoría de destino debe tener los mismos permisos antes de moverlo; la sincronización automática no se aplica.')
      for (const [name, member] of Object.entries(members)) {
        for (const [place, resource] of [['current', current], ...(parent ? [['destination', parent]] : [])]) {
          let allowed
          try {
            const cached = guild.channels?.cache?.get(resource.id)
            const permissions = cached ? cached.permissionsFor(member) : place === 'destination' && resource.id.startsWith('local:') ? member?.permissions : undefined
            const exempt = member?.permissions?.has(F.Administrator, false) || (member?.id && member.id === guild.ownerId)
            const timedOut = !exempt && (member?.isCommunicationDisabled?.() || member?.communicationDisabledUntilTimestamp > Date.now())
            allowed = member && !timedOut && permissions?.has(resource.type === 2 ? [F.ViewChannel, F.ManageChannels, F.Connect] : [F.ViewChannel, F.ManageChannels])
          } catch {}
          add(`${name}_${place}_${id}`, allowed === undefined ? 'unknown' : allowed ? 'passed' : 'failed', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} necesita Ver canal y Administrar canales${resource.type === 2 ? ' y Conectarse a voz' : ''} en ${place === 'current' ? 'el canal actual' : 'la categoría de destino'}, sin restricciones temporales que lo impidan.`)
        }
      }
      current.parentId = parentId
    } else continue
    const changed = channels.find(channel => channel.id === id)
    const count = changed?.parentId == null ? 0 : channels.filter(channel => channel.parentId === changed.parentId).length
    add(`move_capacity_${operation.id}`, count <= 50 ? 'passed' : 'failed', 'Cada categoría debe conservar como máximo 50 canales durante todos los pasos, incluidas las creaciones previas.')
  }
  return checks
}
module.exports = { checkChannelMoves }
