const systems = require('../../systems')

module.exports = async (client, channel) => {
  if (!channel.guild) return

  // Seguridad: anti-nuke (borrado masivo de canales)
  try {
    await systems.security.handleNukeEvent({
      client,
      guild: channel.guild,
      kind: 'channelDelete',
      auditType: systems.security.AuditLogEvent.ChannelDelete,
      meta: { channelId: channel.id, channelName: channel.name }
    })
  } catch (e) {}

  await systems.logs.sendLog(channel.guild, 'channelDelete', { channel })
}
