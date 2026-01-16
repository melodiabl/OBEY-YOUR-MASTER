const { EmbedBuilder, ChannelType } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const AuditLogSchema = require('../../database/schemas/AuditLogSchema')

function toLine (row) {
  const ts = `<t:${Math.floor(new Date(row.createdAt).getTime() / 1000)}:R>`
  const ok = row.ok ? 'ƒo.' : 'ƒ?O'
  const target = row.targetID ? ` -> <@${row.targetID}>` : ''
  return `${ok} ${ts} <@${row.actorID}> \`${row.action}\`${target}`
}

module.exports = createSystemSlashCommand({
  name: 'logs',
  description: 'Logs/Auditoría (consultas + config)',
  moduleKey: 'logs',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'config',
      description: 'Config de logs',
      subcommands: [
        {
          name: 'channel',
          description: 'Set canal de logs',
          options: [{ apply: (sc) => sc.addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LOGS_MANAGE] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const g = await client.db.getGuildData(interaction.guild.id)
            g.logsChannel = channel.id
            await g.save()
            return interaction.reply({ content: `ƒo. logsChannel -> <#${channel.id}>`, ephemeral: true })
          }
        },
        {
          name: 'enable',
          description: 'Habilita el módulo logs',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LOGS_MANAGE] },
          handler: async (client, interaction) => {
            const g = await client.db.getGuildData(interaction.guild.id)
            const modules = g.modules?.get ? g.modules : new Map(Object.entries(g.modules || {}))
            modules.set('logs', true)
            g.modules = modules
            g.markModified('modules')
            await g.save()
            return interaction.reply({ content: 'ƒo. logs -> ON', ephemeral: true })
          }
        },
        {
          name: 'disable',
          description: 'Deshabilita el módulo logs',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LOGS_MANAGE] },
          handler: async (client, interaction) => {
            const g = await client.db.getGuildData(interaction.guild.id)
            const modules = g.modules?.get ? g.modules : new Map(Object.entries(g.modules || {}))
            modules.set('logs', false)
            g.modules = modules
            g.markModified('modules')
            await g.save()
            return interaction.reply({ content: 'ƒo. logs -> OFF', ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'view',
      description: 'Consulta logs',
      subcommands: [
        {
          name: 'recent',
          description: 'Últimos logs',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 25').setRequired(false).setMinValue(1).setMaxValue(25)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limit') || 15
            const rows = await AuditLogSchema.find({ guildID: interaction.guild.id }).sort({ createdAt: -1 }).limit(limit)
            if (!rows.length) return interaction.reply({ content: 'No hay logs aún.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle('Logs recientes')
              .setColor('Blurple')
              .setDescription(rows.map(toLine).join('\n'))
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'user',
          description: 'Logs de un usuario (actor)',
          options: [
            {
              apply: (sc) =>
                sc
                  .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
                  .addIntegerOption(o => o.setName('limit').setDescription('Máx 25').setRequired(false).setMinValue(1).setMaxValue(25))
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('usuario', true)
            const limit = interaction.options.getInteger('limit') || 15
            const rows = await AuditLogSchema.find({ guildID: interaction.guild.id, actorID: user.id }).sort({ createdAt: -1 }).limit(limit)
            if (!rows.length) return interaction.reply({ content: 'No hay logs para ese usuario.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle(`Logs • ${user.username}`)
              .setColor('Blurple')
              .setDescription(rows.map(toLine).join('\n'))
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'action',
          description: 'Logs por acción (ej: slash.moderation)',
          options: [
            {
              apply: (sc) =>
                sc
                  .addStringOption(o => o.setName('action').setDescription('Acción exacta').setRequired(true).setMaxLength(80))
                  .addIntegerOption(o => o.setName('limit').setDescription('Máx 25').setRequired(false).setMinValue(1).setMaxValue(25))
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
          handler: async (client, interaction) => {
            const action = interaction.options.getString('action', true)
            const limit = interaction.options.getInteger('limit') || 15
            const rows = await AuditLogSchema.find({ guildID: interaction.guild.id, action }).sort({ createdAt: -1 }).limit(limit)
            if (!rows.length) return interaction.reply({ content: 'No hay logs para esa acción.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle(`Logs • ${action}`)
              .setColor('Blurple')
              .setDescription(rows.map(toLine).join('\n'))
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'failures',
          description: 'Últimos errores',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 25').setRequired(false).setMinValue(1).setMaxValue(25)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limit') || 15
            const rows = await AuditLogSchema.find({ guildID: interaction.guild.id, ok: false }).sort({ createdAt: -1 }).limit(limit)
            if (!rows.length) return interaction.reply({ content: 'No hay errores registrados.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle('Logs • Errores')
              .setColor('Red')
              .setDescription(rows.map(toLine).join('\n'))
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    }
  ]
})

