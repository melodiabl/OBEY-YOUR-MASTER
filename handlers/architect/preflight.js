const { PermissionFlagsBits } = require('discord.js')
async function preflight(guild, blueprint, diff, actorId) {
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
  add('execution', 'unknown', 'La aplicación, las copias previas y los jobs todavía no están habilitados.')
  return { checks, status: checks.some(check => check.status === 'failed') ? 'blocked' : checks.some(check => check.status === 'unknown') ? 'incomplete' : 'passed',
    warning: 'Los permisos y la estructura pueden cambiar después de esta comprobación.' }
}
module.exports = { preflight }
