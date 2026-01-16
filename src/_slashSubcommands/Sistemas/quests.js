const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { ensureDaily, ensureWeekly, ensureMonthly, isCompleted, dateKeyUTC, weekKeyUTC, monthKeyUTC } = require('../../systems/quests/questService')
const { reward } = require('../../systems/economy/economyService')

function buildEmbed ({ title, key, doc }) {
  const m = doc.tasks.messages
  const w = doc.tasks.work
  return new EmbedBuilder()
    .setTitle(`${title} (${key})`)
    .setColor(isCompleted(doc) ? 'Green' : 'Yellow')
    .addFields(
      { name: 'Mensajes', value: `${m.progress}/${m.goal}`, inline: true },
      { name: 'Work', value: `${w.progress}/${w.goal}`, inline: true },
      { name: 'Reclamado', value: doc.claimed ? 'Sí' : 'No', inline: true }
    )
    .setTimestamp()
}

async function claimReward ({ client, interaction, ensureFn, amount, meta }) {
  const doc = await ensureFn({ guildID: interaction.guild.id, userID: interaction.user.id })
  if (doc.claimed) throw new Error('Ya reclamaste esta recompensa.')
  if (!isCompleted(doc)) throw new Error('Aún no completaste todas las misiones.')

  doc.claimed = true
  await doc.save()

  await reward({
    client,
    guildID: interaction.guild.id,
    actorID: interaction.user.id,
    userID: interaction.user.id,
    amount,
    meta
  })
  return amount
}

module.exports = createSystemSlashCommand({
  name: 'quests',
  description: 'Misiones diarias/semanales/mensuales (base escalable)',
  moduleKey: 'quests',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'daily',
      description: 'Muestra tu progreso diario',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const doc = await ensureDaily({ guildID: interaction.guild.id, userID: interaction.user.id })
        const embed = buildEmbed({ title: 'Daily Quests', key: dateKeyUTC(), doc })
        embed.setFooter({ text: 'Tip: chatea para Mensajes y usa /work para Work.' })
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'weekly',
      description: 'Muestra tu progreso semanal',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const doc = await ensureWeekly({ guildID: interaction.guild.id, userID: interaction.user.id })
        const embed = buildEmbed({ title: 'Weekly Quests', key: weekKeyUTC(), doc })
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'monthly',
      description: 'Muestra tu progreso mensual',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const doc = await ensureMonthly({ guildID: interaction.guild.id, userID: interaction.user.id })
        const embed = buildEmbed({ title: 'Monthly Quests', key: monthKeyUTC(), doc })
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'claim_daily',
      description: 'Reclama recompensa diaria',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 10_000,
      handler: async (client, interaction) => {
        const amount = await claimReward({
          client,
          interaction,
          ensureFn: ensureDaily,
          amount: 250,
          meta: { dateKey: dateKeyUTC(), type: 'daily' }
        })
        return interaction.reply({ content: `ƒo. Recompensa diaria: **${amount}** monedas.`, ephemeral: true })
      }
    },
    {
      name: 'claim_weekly',
      description: 'Reclama recompensa semanal',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 10_000,
      handler: async (client, interaction) => {
        const amount = await claimReward({
          client,
          interaction,
          ensureFn: ensureWeekly,
          amount: 2000,
          meta: { dateKey: weekKeyUTC(), type: 'weekly' }
        })
        return interaction.reply({ content: `ƒo. Recompensa semanal: **${amount}** monedas.`, ephemeral: true })
      }
    },
    {
      name: 'claim_monthly',
      description: 'Reclama recompensa mensual',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 10_000,
      handler: async (client, interaction) => {
        const amount = await claimReward({
          client,
          interaction,
          ensureFn: ensureMonthly,
          amount: 8000,
          meta: { dateKey: monthKeyUTC(), type: 'monthly' }
        })
        return interaction.reply({ content: `ƒo. Recompensa mensual: **${amount}** monedas.`, ephemeral: true })
      }
    }
  ]
})

