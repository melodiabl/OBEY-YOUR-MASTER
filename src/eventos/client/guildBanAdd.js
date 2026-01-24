const systems = require('../../systems')

module.exports = async (client, ban) => {
  const guild = ban?.guild
  if (!guild) return

  // Seguridad: anti-nuke (ban masivo)
  try {
    await systems.security.handleNukeEvent({
      client,
      guild,
      kind: 'guildBanAdd',
      auditType: systems.security.AuditLogEvent.MemberBanAdd,
      meta: { targetId: ban?.user?.id || null }
    })
  } catch (e) {}

  await systems.logs.sendLog(guild, 'guildBanAdd', { ban })
}

