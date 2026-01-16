const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { getRepDoc, giveRep, removeRep, topRep } = require('../../systems/reputation/reputationService')

module.exports = createSystemSlashCommand({
  name: 'rep',
  description: 'Reputación social (give/remove/stats/leaderboard)',
  moduleKey: 'reputation',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'config',
      description: 'Configuración de reputación (admin)',
      subcommands: [
        {
          name: 'daily_limit',
          description: 'Set límite diario de rep que puede dar un usuario',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(0).setMaxValue(50)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.REP_CONFIG] },
          handler: async (client, interaction) => {
            const amount = interaction.options.getInteger('amount', true)
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.repDailyLimit = amount
            await doc.save()
            return interaction.reply({ content: `ƒo. repDailyLimit = ${amount}`, ephemeral: true })
          }
        },
        {
          name: 'cooldown_hours',
          description: 'Set cooldown (horas) entre gives',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('hours').setDescription('Horas').setRequired(true).setMinValue(0).setMaxValue(168)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.REP_CONFIG] },
          handler: async (client, interaction) => {
            const hours = interaction.options.getInteger('hours', true)
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.repCooldownMs = hours * 60 * 60 * 1000
            await doc.save()
            return interaction.reply({ content: `ƒo. repCooldownMs = ${doc.repCooldownMs}ms`, ephemeral: true })
          }
        }
      ]
    }
  ],
  subcommands: [
    {
      name: 'give',
      description: 'Da +1 reputación a un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 1_000,
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('user', true)
        if (target.bot) return interaction.reply({ content: 'No puedes dar reputación a bots.', ephemeral: true })
        const guildDoc = await client.db.getGuildData(interaction.guild.id)
        const res = await giveRep({
          guildID: interaction.guild.id,
          giverID: interaction.user.id,
          targetID: target.id,
          cooldownMs: Number(guildDoc.repCooldownMs || 0),
          dailyLimit: Number(guildDoc.repDailyLimit || 0)
        })
        return interaction.reply({ content: `ƒo. +1 reputación para <@${target.id}> (total: **${res.targetRep}**).`, ephemeral: true })
      }
    },
    {
      name: 'remove',
      description: 'Quita reputación (mod)',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
              .addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(1).setMaxValue(100))
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('user', true)
        const amount = interaction.options.getInteger('amount', true)
        const res = await removeRep({ guildID: interaction.guild.id, targetID: user.id, amount })
        return interaction.reply({ content: `ƒo. Reputación de <@${user.id}>: **${res.targetRep}**`, ephemeral: true })
      }
    },
    {
      name: 'stats',
      description: 'Muestra reputación',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user
        const doc = await getRepDoc({ guildID: interaction.guild.id, userID: user.id })
        const embed = new EmbedBuilder()
          .setTitle(`Reputación • ${user.username}`)
          .setColor('Yellow')
          .addFields(
            { name: 'Rep', value: String(doc.rep || 0), inline: true },
            { name: 'Daily', value: `${doc.dailyCount || 0}`, inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'leaderboard',
      description: 'Top reputación',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limit') || 10
        const rows = await topRep({ guildID: interaction.guild.id, limit })
        if (!rows.length) return interaction.reply({ content: 'No hay datos aún.', ephemeral: true })
        const lines = rows.map((r, idx) => `**${idx + 1}.** <@${r.userID}> • **${r.rep}**`)
        const embed = new EmbedBuilder().setTitle('Top Reputación').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})
