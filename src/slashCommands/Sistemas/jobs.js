const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { jobsCatalog, setJob, getProfile, doWork, nextLevelXp } = require('../../systems/jobs/jobsService')

module.exports = createSystemSlashCommand({
  name: 'jobs',
  description: 'Trabajos, profesiones e ingresos (base)',
  moduleKey: 'jobs',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'list',
      description: 'Lista trabajos disponibles',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const lines = jobsCatalog.map(j => `- \`${j.id}\` **${j.name}** (CD: ${Math.floor((j.cooldownMs || 0) / 60000)}m)`)
        return interaction.reply({ content: `**Trabajos**\n${lines.join('\n')}`, ephemeral: true })
      }
    },
    {
      name: 'set',
      description: 'Elige tu trabajo',
      options: [
        {
          apply: (sc) =>
            sc.addStringOption(o =>
              o
                .setName('id')
                .setDescription('ID del trabajo')
                .setRequired(true)
                .setAutocomplete(true)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 5_000,
      handler: async (client, interaction) => {
        const jobId = interaction.options.getString('id', true)
        const profile = await setJob({ guildID: interaction.guild.id, userID: interaction.user.id, jobId })
        return interaction.reply({ content: `✅ Trabajo asignado: \`${profile.jobId}\`.`, ephemeral: true })
      }
    },
    {
      name: 'profile',
      description: 'Muestra tu perfil de trabajo',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const profile = await getProfile({ guildID: interaction.guild.id, userID: interaction.user.id })
        const needed = nextLevelXp(profile.jobLevel || 1)
        const embed = new EmbedBuilder()
          .setTitle('🧑‍💼 Job Profile')
          .setColor('Blurple')
          .addFields(
            { name: 'Trabajo', value: profile.jobId ? `\`${profile.jobId}\`` : '*Sin trabajo*', inline: true },
            { name: 'Nivel', value: String(profile.jobLevel || 1), inline: true },
            { name: 'XP', value: `${profile.jobXp || 0}/${needed}`, inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'work',
      description: 'Trabaja en tu profesión (ingresos + XP)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 3_000,
      handler: async (client, interaction) => {
        const res = await doWork({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const msg = [
          `✅ Ganaste **${res.amount}** monedas como **${res.job.name}**.`,
          `+XP Job: **${res.xpGain}**${res.leveledUp ? ' (¡subiste de nivel!)' : ''}`
        ].join('\n')
        return interaction.reply({ content: msg, ephemeral: true })
      }
    }
  ],
  async autocomplete (client, interaction) {
    const focused = interaction.options.getFocused(true)
    if (focused.name !== 'id') return interaction.respond([])
    const q = String(focused.value || '').toLowerCase()
    const out = jobsCatalog
      .filter(j => j.id.includes(q) || j.name.toLowerCase().includes(q))
      .slice(0, 25)
      .map(j => ({ name: `${j.name} (${j.id})`, value: j.id }))
    return interaction.respond(out)
  }
})

