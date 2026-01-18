const { EmbedBuilder } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')
const AuditLogSchema = require('../../database/schemas/AuditLogSchema')

function safeJson (obj, maxLen = 1800) {
  try {
    const s = JSON.stringify(obj)
    if (s.length <= maxLen) return s
    return s.slice(0, maxLen) + '…'
  } catch (e) {
    return null
  }
}

function buildAuditEmbed (payload) {
  const embed = new EmbedBuilder()
    .setTitle('🧾 Auditoría')
    .setColor(payload.ok ? 'Green' : 'Red')
    .setTimestamp(new Date(payload.createdAt || Date.now()))
    .addFields(
      { name: 'Acción', value: payload.action || 'unknown', inline: true },
      { name: 'Actor', value: payload.actorID ? `<@${payload.actorID}>` : 'N/A', inline: true }
    )

  if (payload.targetID) embed.addFields({ name: 'Objetivo', value: `<@${payload.targetID}>`, inline: true })
  if (payload.guildID) embed.setFooter({ text: `Guild: ${payload.guildID}` })

  const details = safeJson(payload.meta)
  if (details) embed.addFields({ name: 'Meta', value: '```json\n' + details + '\n```' })

  return embed
}

async function writeAuditLog (payload) {
  try {
    const doc = new AuditLogSchema({
      guildID: payload.guildID,
      actorID: payload.actorID,
      action: payload.action,
      targetID: payload.targetID || null,
      meta: payload.meta || {},
      ok: Boolean(payload.ok),
      createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date()
    })
    await doc.save()
  } catch (e) {
    // La auditoría nunca debe romper el comando.
  }
}

async function sendAuditToChannel ({ client, guild, payload }) {
  try {
    const guildData = await GuildSchema.findOne({ guildID: guild.id })
    const logsChannelId = guildData?.logsChannel
    if (!logsChannelId) return

    // Módulo logs (opcional)
    const modules = guildData?.modules
    const logsEnabled = modules?.get ? modules.get('logs') !== false : modules?.logs !== false
    if (!logsEnabled) return

    const channel = guild.channels.cache.get(logsChannelId)
    if (!channel) return

    const embed = buildAuditEmbed(payload)
    await channel.send({ embeds: [embed] })
  } catch (e) {}
}

async function audit ({ client, guild, payload }) {
  await writeAuditLog(payload)
  await sendAuditToChannel({ client, guild, payload })
}

module.exports = {
  audit
}
