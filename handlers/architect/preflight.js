const { PermissionFlagsBits } = require('discord.js')
async function preflight(guild, blueprint, diff, actorId, { executionAvailable = false } = {}) {
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
    const belowBot = bot?.roles?.highest && role.position < bot.roles.highest.position
    const belowActor = actor?.id === guild.ownerId || (actor?.roles?.highest && role.position < actor.roles.highest.position)
    if (diff.changes.some(change => change.kind === 'roles' && change.id === role.id && (change.operation === 'create' || change.field === 'permissions'))) {
      for (const [name, member] of [['actor', actor], ['bot', bot]]) add(`${name}_grant_${role.id}`, member ? (member.permissions.has(BigInt(role.permissions)) ? 'passed' : 'failed') : 'unknown', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} debe tener los permisos que propone conceder al rol ${role.name}.`)
    }
    add(`hierarchy_${role.id}`, !bot || !actor ? 'unknown' : belowBot && belowActor ? 'passed' : 'failed', `El rol ${role.name} debe estar por debajo del rol de OBEY y del administrador.`)
  }
  add('deletions', 'passed', 'Esta propuesta conserva todos los recursos existentes.')
  if (executionAvailable) {
    if (diff.changes.length) add('actor_guild', actor ? (actor.permissions.has(PermissionFlagsBits.ManageGuild) ? 'passed' : 'failed') : 'unknown', 'Tu cuenta necesita Administrar servidor durante la aplicación.')
    try { if (diff.changes.length) require('./application').compileEdits(diff); add('execution', 'passed', 'Aplicación confirmada de nombres, temas de texto y colores de roles disponible en este canary.') }
    catch { add('execution', 'failed', 'La aplicación actual admite nombres, temas de canales de texto y colores de roles existentes. Creaciones, movimientos y permisos siguen pendientes.') }
    for (const change of diff.changes.filter(change => change.kind === 'roles' && change.field === 'color')) {
      const colors = guild.roles?.cache?.get(change.id)?.colors
      add(`color_style_${change.id}`, !colors ? 'unknown' : colors.secondaryColor == null && colors.tertiaryColor == null ? 'passed' : 'failed', 'Solo se editan colores simples; los degradados y estilos holográficos se conservan.')
    }
    for (const id of new Set(diff.changes.filter(change => change.kind === 'channels').map(change => change.id))) {
      const channel = guild.channels?.cache?.get(id)
      for (const [name, member] of [['actor', actor], ['bot', bot]]) {
        let allowed
        try { allowed = member && channel?.permissionsFor(member)?.has(PermissionFlagsBits.ManageChannels) } catch {}
        add(`${name}_channel_${id}`, allowed === undefined ? 'unknown' : allowed ? 'passed' : 'failed', `${name === 'bot' ? 'OBEY' : 'Tu cuenta'} necesita Administrar canales efectivo en el canal que se editará.`)
      }
    }
  } else add('execution', 'unknown', 'La aplicación a Discord requiere habilitar un canary autorizado.')
  return { checks, status: checks.some(check => check.status === 'failed') ? 'blocked' : checks.some(check => check.status === 'unknown') ? 'incomplete' : 'passed',
    warning: 'Los permisos y la estructura pueden cambiar después de esta comprobación.' }
}
module.exports = { preflight }
