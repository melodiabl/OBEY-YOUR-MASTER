const { AuditLogEvent, EmbedBuilder, ChannelType } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')

function channelTypeName (type) {
  switch (type) {
    case ChannelType.GuildText: return 'Texto'
    case ChannelType.GuildVoice: return 'Voz'
    case ChannelType.GuildCategory: return 'Categoría'
    case ChannelType.GuildAnnouncement: return 'Anuncios'
    case ChannelType.GuildStageVoice: return 'Stage'
    case ChannelType.GuildForum: return 'Foro'
    case ChannelType.PublicThread: return 'Hilo público'
    case ChannelType.PrivateThread: return 'Hilo privado'
    case ChannelType.AnnouncementThread: return 'Hilo de anuncios'
    default: return String(type)
  }
}

module.exports = async (client, createdChannel) => {
  try {
    // channelCreate puede ocurrir fuera de guild (DMs, etc). Evitar crash.
    if (!createdChannel?.guild) return

    const guild = createdChannel.guild

    // Canal destino (config por servidor).
    const guildData = await GuildSchema.findOne({ guildID: guild.id }).catch(() => null)
    const logsChannelId = guildData?.logsChannel
    if (!logsChannelId) return

    // Módulo logs (opcional).
    const modules = guildData?.modules
    const logsEnabled = modules?.get ? modules.get('logs') !== false : modules?.logs !== false
    if (!logsEnabled) return

    const logsChannel = guild.channels.cache.get(logsChannelId)
    if (!logsChannel) return

    // Audit logs (puede tardar un poco en aparecer; best-effort).
    let executorTag = 'Desconocido'
    try {
      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 })
      const entry = audit?.entries?.first()
      if (entry?.executor?.tag) executorTag = entry.executor.tag
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle('Canal creado')
      .setColor('Green')
      .addFields(
        { name: 'Canal', value: `${createdChannel.name} (<#${createdChannel.id}>)` },
        { name: 'Tipo', value: channelTypeName(createdChannel.type), inline: true },
        { name: 'ID', value: createdChannel.id, inline: true },
        { name: 'Creado por', value: executorTag, inline: true }
      )
      .setTimestamp()

    await logsChannel.send({ embeds: [embed] })
  } catch (e) {
    // Nunca crashear por logs.
  }
}
