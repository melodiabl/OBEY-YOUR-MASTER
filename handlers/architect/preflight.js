const { PermissionFlagsBits } = require('discord.js')
async function preflight(guild, blueprint, diff, actorId, { executionAvailable = false, idMap = {} } = {}) {
  const checks = []
  const add = (code, status, detail) => checks.push({ code, status, detail })
  let actor, bot
  if (diff.changes.length) {
    try {
      if (!actorId || !guild.members?.fetch || !guild.members?.fetchMe) throw new Error('member_access_unknown')
      ;[actor, bot] = await Promise.all([guild.members.fetch({ user: actorId, force: true }), guild.members.fetchMe({ force: true })])
    } catch { add('members', 'unknown', 'No se pudieron verificar los permisos actuales del administrador y de OBEY.') }
  }
  for (const [kind, flag, label] of [['channels', PermissionFlagsBits.ManageChannels, 'Administrar canales'], ['roles', PermissionFlagsBits.ManageRoles, 'Administrar roles']]) {
    if (!diff.changes.some(change => change.kind === kind)) continue
    for (const [name, member] of [['actor', actor], ['bot', bot]]) {
      add(`${name}_${kind}`, member ? (member.permissions.has(flag) ? 'passed' : 'failed') : 'unknown', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} necesita ${label}.`)
    }
  }
  for (const role of blueprint.roles) {
    if (!diff.changes.some(change => change.kind === 'roles' && change.id === role.id)) continue
    const position = guild.roles?.cache?.get(idMap[role.id] || role.id)?.position ?? role.position
    const belowBot = bot?.roles?.highest && position < bot.roles.highest.position
    const belowActor = actor?.id === guild.ownerId || (actor?.roles?.highest && position < actor.roles.highest.position)
    if (diff.changes.some(change => change.kind === 'roles' && change.id === role.id && (change.operation === 'create' || change.field === 'permissions'))) {
      for (const [name, member] of [['actor', actor], ['bot', bot]]) add(`${name}_grant_${role.id}`, member ? (member.permissions.has(BigInt(role.permissions)) ? 'passed' : 'failed') : 'unknown', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} debe tener los permisos que propone conceder al rol ${role.name}.`)
    }
    add(`hierarchy_${role.id}`, !bot || !actor ? 'unknown' : belowBot && belowActor ? 'passed' : 'failed', `El rol ${role.name} debe estar por debajo del rol de OBEY y del administrador.`)
  }
  add('deletions', 'passed', 'Esta propuesta conserva todos los recursos existentes.')
  if (executionAvailable) {
    if (diff.changes.length) add('actor_guild', actor ? (actor.permissions.has(PermissionFlagsBits.ManageGuild) ? 'passed' : 'failed') : 'unknown', 'Tu cuenta necesita Administrar servidor durante la aplicación.')
    try { if (diff.changes.length) require('./application').compileEdits(diff); add('execution', 'passed', 'Aplicación confirmada de ediciones y creaciones básicas disponible en este canary.') }
    catch { add('execution', 'failed', 'Solo se aplican nombres, temas y colores existentes, roles nuevos sin permisos y canales básicos sin sobrescrituras ni posiciones personalizadas.') }
    const creations = diff.changes.filter(change => change.operation === 'create')
    if (creations.length) {
      add('capacity', (blueprint.roles?.length <= 250 && blueprint.channels?.length <= 500 && blueprint.channels.every(parent => parent.type !== 4 || blueprint.channels.filter(channel => channel.parentId === parent.id).length <= 50)) ? 'passed' : 'failed', 'La propuesta debe respetar 250 roles, 500 canales y 50 canales por categoría.')
      add('creation_audit', bot ? (bot.permissions.has(PermissionFlagsBits.ViewAuditLog) ? 'passed' : 'failed') : 'unknown', 'OBEY necesita Ver registro de auditoría para verificar respuestas de creación perdidas.')
      add('creation_transport', typeof guild.client?.rest?.options?.makeRequest === 'function' ? 'passed' : 'unknown', 'El transporte debe permitir impedir reintentos de creaciones inciertas.')
      for (const change of creations.filter(change => change.kind === 'channels' && change.after?.type === 2)) {
        add(`bitrate_${change.id}`, Number.isInteger(guild.maximumBitrate) ? change.after.bitrate <= guild.maximumBitrate ? 'passed' : 'failed' : 'unknown', 'El bitrate debe caber en la capacidad actual de voz del servidor.')
      }
    }
    for (const change of diff.changes.filter(change => change.kind === 'roles' && change.field === 'color')) {
      const colors = guild.roles?.cache?.get(change.id)?.colors
      add(`color_style_${change.id}`, !colors ? 'unknown' : colors.secondaryColor == null && colors.tertiaryColor == null ? 'passed' : 'failed', 'Solo se editan colores simples; los degradados y estilos holográficos se conservan.')
    }
    for (const id of new Set(diff.changes.filter(change => change.kind === 'channels').map(change => change.id))) {
      const creation = creations.find(change => change.kind === 'channels' && change.id === id)
      const proposed = creation?.after
      const parent = proposed?.parentId && blueprint.channels?.find(channel => channel.id === proposed.parentId)
      if (creation && parent) add(`parent_permissions_${id}`, parent.overwrites?.length === 0 ? 'passed' : 'failed', 'Los canales nuevos sin sobrescrituras solo se crean en categorías sin sobrescrituras; los permisos privados requieren una propuesta específica.')
      const parentId = idMap[proposed?.parentId] || proposed?.parentId
      const channel = guild.channels?.cache?.get(idMap[id] || id) || (creation && parentId && guild.channels?.cache?.get(parentId))
      for (const [name, member] of [['actor', actor], ['bot', bot]]) {
        let allowed
        try {
          const permissions = channel ? channel.permissionsFor(member) : creation && (!parent || parent.id.startsWith('local:')) ? member?.permissions : undefined
          allowed = member && permissions?.has(creation ? [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel] : PermissionFlagsBits.ManageChannels)
        } catch {}
        add(`${name}_channel_${id}`, allowed === undefined ? 'unknown' : allowed ? 'passed' : 'failed', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} necesita Administrar canales efectivo${creation ? ' y conservar acceso al canal nuevo' : ' en el canal que se editará'}.`)
      }
    }
  } else add('execution', 'unknown', 'La aplicación a Discord requiere habilitar un canary autorizado.')
  return { checks, status: checks.some(check => check.status === 'failed') ? 'blocked' : checks.some(check => check.status === 'unknown') ? 'incomplete' : 'passed',
    warning: 'Los permisos y la estructura pueden cambiar después de esta comprobación.' }
}
module.exports = { preflight }
