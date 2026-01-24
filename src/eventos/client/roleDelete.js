const systems = require('../../systems')

module.exports = async (client, role) => {
  if (!role?.guild) return

  // Seguridad: anti-nuke (borrado masivo de roles)
  try {
    await systems.security.handleNukeEvent({
      client,
      guild: role.guild,
      kind: 'roleDelete',
      auditType: systems.security.AuditLogEvent.RoleDelete,
      meta: { roleId: role.id, roleName: role.name }
    })
  } catch (e) {}

  await systems.logs.sendLog(role.guild, 'roleDelete', { role })
}

