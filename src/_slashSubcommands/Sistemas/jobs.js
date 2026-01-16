const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { jobsCatalog, getJob, setJob, quitJob, getProfile, doWork, topJobs, nextLevelXp, cooldownRemainingMs } = require('../../systems/jobs/jobsService')

module.exports = createSystemSlashCommand({
  name: 'jobs',
  description: 'Trabajos, profesiones e ingresos (escalable)',
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
      name: 'info',
      description: 'Info de un trabajo',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('id').setDescription('ID del trabajo').setRequired(true).setAutocomplete(true)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const jobId = interaction.options.getString('id', true)
        const job = getJob(jobId)
        if (!job) return interaction.reply({ content: 'Trabajo inválido.', ephemeral: true })
        const embed = new EmbedBuilder()
          .setTitle(`Trabajo • ${job.name}`)
          .setColor('Blurple')
          .addFields(
            { name: 'ID', value: `\`${job.id}\``, inline: true },
            { name: 'Cooldown', value: `${Math.floor((job.cooldownMs || 0) / 60000)}m`, inline: true },
            { name: 'Pay', value: `${job.basePayMin}-${job.basePayMax}`, inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'set',
      description: 'Elige tu trabajo',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('id').setDescription('ID del trabajo').setRequired(true).setAutocomplete(true)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 5_000,
      handler: async (client, interaction) => {
        const jobId = interaction.options.getString('id', true)
        const profile = await setJob({ guildID: interaction.guild.id, userID: interaction.user.id, jobId })
        return interaction.reply({ content: `ƒo. Trabajo asignado: \`${profile.jobId}\`.`, ephemeral: true })
      }
    },
    {
      name: 'quit',
      description: 'Renuncia a tu trabajo',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await quitJob({ guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: 'ƒo. Renunciaste a tu trabajo.', ephemeral: true })
      }
    },
    {
      name: 'profile',
      description: 'Perfil de trabajo',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction, { identity }) => {
        const target = interaction.options.getUser('usuario') || interaction.user
        if (target.id !== interaction.user.id && identity?.role === INTERNAL_ROLES.USER) {
          return interaction.reply({ content: 'Solo MOD+ puede ver perfiles de otros.', ephemeral: true })
        }
        const profile = await getProfile({ guildID: interaction.guild.id, userID: target.id })
        const needed = nextLevelXp(profile.jobLevel || 1)
        const embed = new EmbedBuilder()
          .setTitle(`Job Profile • ${target.username}`)
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
      name: 'cooldown',
      description: 'Cooldown restante para trabajar',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const profile = await getProfile({ guildID: interaction.guild.id, userID: interaction.user.id })
        if (!profile.jobId) return interaction.reply({ content: 'No tienes trabajo. Usa `/jobs set`.', ephemeral: true })
        const job = getJob(profile.jobId)
        if (!job) return interaction.reply({ content: 'Tu trabajo ya no existe. Reasignalo.', ephemeral: true })
        const rem = cooldownRemainingMs({ profile, job })
        if (rem <= 0) return interaction.reply({ content: 'ƒo. Puedes trabajar ahora.', ephemeral: true })
        return interaction.reply({ content: `ƒ?ü Cooldown: **${Math.ceil(rem / 60000)} min**`, ephemeral: true })
      }
    },
    {
      name: 'salary',
      description: 'Muestra tu salario estimado',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const profile = await getProfile({ guildID: interaction.guild.id, userID: interaction.user.id })
        if (!profile.jobId) return interaction.reply({ content: 'No tienes trabajo. Usa `/jobs set`.', ephemeral: true })
        const job = getJob(profile.jobId)
        if (!job) return interaction.reply({ content: 'Tu trabajo ya no existe. Reasignalo.', ephemeral: true })
        const level = Number(profile.jobLevel || 1)
        const payMin = Number(job.basePayMin || 0) + Math.floor(level * 2)
        const payMax = Number(job.basePayMax || 0) + Math.floor(level * 3)
        return interaction.reply({ content: `Salario estimado: **${payMin} - ${payMax}** (nivel ${level}).`, ephemeral: true })
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
          `ƒo. Ganaste **${res.amount}** monedas como **${res.job.name}**.`,
          `+XP Job: **${res.xpGain}**${res.leveledUp ? ' (subiste de nivel)' : ''}`
        ].join('\n')
        return interaction.reply({ content: msg, ephemeral: true })
      }
    },
    {
      name: 'top',
      description: 'Ranking de trabajos (por nivel)',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const rows = await topJobs({ guildID: interaction.guild.id, limit })
        if (!rows.length) return interaction.reply({ content: 'No hay perfiles de trabajos aún.', ephemeral: true })

        const lines = rows.map((r, i) => `**${i + 1}.** <@${r.userID}> • \`${r.jobId}\` • Lv **${r.jobLevel}**`)
        const embed = new EmbedBuilder().setTitle('Top Jobs').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
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

