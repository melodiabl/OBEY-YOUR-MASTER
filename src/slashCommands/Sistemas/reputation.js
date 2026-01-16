const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { getRepDoc, giveRep, topRep } = require('../../systems/reputation/reputationService')

module.exports = createSystemSlashCommand({
  name: 'reputation',
  description: 'Reputación social y rankings (base)',
  moduleKey: 'levels',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'profile',
      description: 'Muestra tu reputación (o la de un usuario)',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario') || interaction.user
        const doc = await getRepDoc({ guildID: interaction.guild.id, userID: user.id })
        return interaction.reply({ content: `⭐ Reputación de <@${user.id}>: **${doc.rep}**`, ephemeral: true })
      }
    },
    {
      name: 'give',
      description: 'Da +1 reputación a un usuario (cooldown)',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 2_000,
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        if (target.bot) return interaction.reply({ content: 'No puedes dar reputación a bots.', ephemeral: true })
        const res = await giveRep({
          guildID: interaction.guild.id,
          giverID: interaction.user.id,
          targetID: target.id
        })
        try {
          await target.send(`⭐ Recibiste +1 reputación en **${interaction.guild.name}**. Total: **${res.targetRep}**.`)
        } catch (e) {}
        return interaction.reply({ content: `✅ Diste +1 reputación a <@${target.id}> (total: **${res.targetRep}**).`, ephemeral: true })
      }
    },
    {
      name: 'top',
      description: 'Top reputación del servidor',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const rows = await topRep({ guildID: interaction.guild.id, limit })
        if (!rows.length) return interaction.reply({ content: 'No hay datos de reputación aún.', ephemeral: true })

        const lines = rows.map((r, idx) => `**${idx + 1}.** <@${r.userID}> — **${r.rep}**`)
        const embed = new EmbedBuilder().setTitle('⭐ Top Reputación').setColor('Yellow').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})

