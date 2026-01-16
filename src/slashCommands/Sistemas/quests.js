const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { ensureDaily, isCompleted, dateKeyUTC } = require('../../systems/quests/questService')
const { reward } = require('../../systems/economy/economyService')

module.exports = createSystemSlashCommand({
  name: 'quests',
  description: 'Misiones diarias/semanales y logros (base)',
  moduleKey: 'quests',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'daily',
      description: 'Muestra tu progreso de misiones diarias',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const doc = await ensureDaily({ guildID: interaction.guild.id, userID: interaction.user.id })
        const m = doc.tasks.messages
        const w = doc.tasks.work

        const embed = new EmbedBuilder()
          .setTitle(`🧭 Daily Quests (${dateKeyUTC()})`)
          .setColor(isCompleted(doc) ? 'Green' : 'Yellow')
          .addFields(
            { name: 'Mensajes', value: `${m.progress}/${m.goal}`, inline: true },
            { name: 'Work', value: `${w.progress}/${w.goal}`, inline: true },
            { name: 'Reclamado', value: doc.claimed ? 'Sí' : 'No', inline: true }
          )
          .setFooter({ text: 'Tip: chatea para subir "Mensajes" y usa /work para "Work".' })
          .setTimestamp()

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'claim',
      description: 'Reclama la recompensa diaria si completaste todo',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 10_000,
      handler: async (client, interaction) => {
        const doc = await ensureDaily({ guildID: interaction.guild.id, userID: interaction.user.id })
        if (doc.claimed) return interaction.reply({ content: 'Ya reclamaste la recompensa de hoy.', ephemeral: true })
        if (!isCompleted(doc)) return interaction.reply({ content: 'Aún no completaste todas las misiones de hoy.', ephemeral: true })

        doc.claimed = true
        await doc.save()

        const amount = 250
        await reward({
          client,
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          userID: interaction.user.id,
          amount,
          meta: { dateKey: doc.dateKey, type: 'daily' }
        })

        return interaction.reply({ content: `✅ Recompensa reclamada: **${amount}** monedas.`, ephemeral: true })
      }
    }
  ]
})

