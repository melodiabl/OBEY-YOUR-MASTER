const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const AuditLogSchema = require('../../database/schemas/AuditLogSchema')
const EconomyTransactionSchema = require('../../database/schemas/EconomyTransactionSchema')
const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
const UserSchema = require('../../database/schemas/UserSchema')

function formatMs (ms) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}

async function topCommands ({ guildID, limit = 10, days = 1 }) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows = await AuditLogSchema.aggregate([
    { $match: { guildID, createdAt: { $gte: since }, ok: true, action: { $regex: /^slash\\./ } } },
    { $group: { _id: '$action', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: limit }
  ])
  return rows.map(r => ({ action: r._id, n: r.n }))
}

module.exports = createSystemSlashCommand({
  name: 'stats',
  description: 'Estadísticas del bot/servidor',
  moduleKey: 'stats',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'server',
      description: 'Stats del servidor',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.STATS_VIEW] },
      handler: async (client, interaction) => {
        const g = interaction.guild
        const embed = new EmbedBuilder()
          .setTitle(`Stats • ${g.name}`)
          .setColor('Blurple')
          .addFields(
            { name: 'Members', value: String(g.memberCount || 0), inline: true },
            { name: 'Channels', value: String(g.channels.cache.size || 0), inline: true },
            { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'uptime',
      description: 'Uptime del bot',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        return interaction.reply({ content: `Uptime: **${formatMs(client.uptime || 0)}**`, ephemeral: true })
      }
    },
    {
      name: 'latency',
      description: 'Latencia',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        return interaction.reply({ content: `WS ping: **${Math.round(client.ws.ping)}ms**`, ephemeral: true })
      }
    },
    {
      name: 'commands',
      description: 'Uso de comandos (últimas 24h)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.STATS_VIEW] },
      handler: async (client, interaction) => {
        const top = await topCommands({ guildID: interaction.guild.id, limit: 10, days: 1 })
        if (!top.length) return interaction.reply({ content: 'No hay datos de comandos aún.', ephemeral: true })
        const lines = top.map((r, i) => `**${i + 1}.** \`${r.action}\` • **${r.n}**`)
        const embed = new EmbedBuilder().setTitle('Top comandos (24h)').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'economy',
      description: 'Stats de economía (transacciones)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.STATS_VIEW] },
      handler: async (client, interaction) => {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const rows = await EconomyTransactionSchema.aggregate([
          { $match: { guildID: interaction.guild.id, createdAt: { $gte: since } } },
          { $group: { _id: '$type', n: { $sum: 1 }, sum: { $sum: '$amount' } } },
          { $sort: { n: -1 } },
          { $limit: 10 }
        ])
        if (!rows.length) return interaction.reply({ content: 'No hay transacciones en 24h.', ephemeral: true })
        const lines = rows.map(r => `- \`${r._id}\` • n=${r.n} • sum=${r.sum}`)
        const embed = new EmbedBuilder().setTitle('Economía • 24h').setColor('Green').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'moderation',
      description: 'Stats de moderación (casos)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.STATS_VIEW] },
      handler: async (client, interaction) => {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const rows = await ModerationCaseSchema.aggregate([
          { $match: { guildID: interaction.guild.id, createdAt: { $gte: since } } },
          { $group: { _id: '$type', n: { $sum: 1 } } },
          { $sort: { n: -1 } }
        ])
        if (!rows.length) return interaction.reply({ content: 'No hay casos en 7 días.', ephemeral: true })
        const lines = rows.map(r => `- \`${r._id}\` • **${r.n}**`)
        const embed = new EmbedBuilder().setTitle('Moderación • 7d').setColor('Red').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'levels',
      description: 'Stats de niveles (top global)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.STATS_VIEW] },
      handler: async (client, interaction) => {
        const rows = await UserSchema.find({}).sort({ level: -1, xp: -1 }).limit(10)
        if (!rows.length) return interaction.reply({ content: 'No hay datos aún.', ephemeral: true })
        const lines = rows.map((u, i) => `**${i + 1}.** <@${u.userID}> • lvl ${u.level || 1} (xp ${u.xp || 0})`)
        const embed = new EmbedBuilder().setTitle('Levels • Top global').setColor('Blurple').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})

