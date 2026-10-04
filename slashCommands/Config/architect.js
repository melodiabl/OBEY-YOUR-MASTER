const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js')
const { diffBlueprint } = require('../../handlers/architect/diff')
module.exports = {
  name: 'architect', description: 'Analizar el servidor y consultar tu propuesta Architect', memberpermissions: ['ManageGuild'],
  options: [{ StringChoices: { name: 'accion', description: 'Consultar Architect o solicitar un análisis persistente', required: false,
    choices: [['Consultar', 'consultar'], ['Analizar en segundo plano', 'analizar']] } }],
  run: async (client, interaction) => {
    const denied = 'Necesitas el permiso Administrar servidor para abrir Architect.'
    if (!interaction.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: denied, ephemeral: true })
    await interaction.deferReply({ ephemeral: true })
    try {
      const member = await interaction.guild.members.fetch({ user: interaction.user.id, force: true })
      if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.editReply({ content: denied })
      if (!client.architect) return interaction.editReply({ content: 'Architect no está disponible en este momento.' })
      if (interaction.options?.getString?.('accion') === 'analizar') {
        if (!client.jobs?.available()) return interaction.editReply({ content: 'Los trabajos no están disponibles. Puedes seguir consultando y editando Architect.' })
        const job = await client.jobs.submit({ guildId: interaction.guild.id, actorId: interaction.user.id,
          type: 'architect.snapshot', idempotencyKey: `discord-${interaction.id}` })
        const status = { queued: 'encolado', running: 'en curso', completed: 'completado', failed: 'fallido', cancelled: 'cancelado' }[job.status]
        return interaction.editReply({ content: `Análisis ${status}. Consulta su estado en Architect. Referencia: ${job.id}`, allowedMentions: { parse: [] } })
      }
      const state = await client.architect.read(interaction.guild, interaction.user.id)
      const categories = state.snapshot.channels.filter(channel => channel.type === 4).length
      const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`Architect · ${interaction.guild.name}`)
        .addFields({ name: 'Estructura actual', value: `${categories} categorías · ${state.snapshot.channels.length - categories} canales · ${state.snapshot.roles.length} roles` })
        .setFooter({ text: `Estructura consultada · ${state.snapshot.revision.slice(0, 12)}` })
      if (state.draft) {
        const diff = diffBlueprint(state.draft.snapshot, state.draft.blueprint)
        embed.addFields({ name: `Tu borrador · revisión ${state.draft.draftRevision}`, value: `${diff.changes.length} cambios propuestos.${state.draftStale ? ' La estructura de Discord cambió desde ese borrador.' : ''}` })
      } else if (state.storageAvailable === false) embed.addFields({ name: 'Tu propuesta', value: 'El almacenamiento de borradores no está disponible. No se pudo consultar tu propuesta guardada.' })
      else embed.addFields({ name: 'Tu propuesta', value: 'Todavía no tienes un borrador guardado. Puedes diseñarlo desde el editor web.' })
      embed.setDescription('Consulta categorías, canales y roles; edita una propuesta y revisa los cambios. La aplicación a Discord y las copias previas siguen pendientes.')
      if (client.jobs) {
        try {
          const jobs = await client.jobs.list(interaction.guild.id, interaction.user.id)
          const labels = { queued: 'En cola', running: 'Leyendo estructura', completed: 'Completado', failed: 'Falló', cancelled: 'Cancelado' }
          if (jobs.length) embed.addFields({ name: 'Tus análisis recientes', value: jobs.slice(0, 3).map(job => `${labels[job.status]} · ${job.progress.completed}/${job.progress.total} pasos`).join('\n') })
        } catch { embed.addFields({ name: 'Tus análisis', value: 'No se pudo consultar el historial de trabajos.' }) }
      }
      const components = []
      try {
        const url = new URL(process.env.DASHBOARD_BASE_URL)
        if (['http:', 'https:'].includes(url.protocol)) {
          url.pathname = `/architect/${interaction.guild.id}`; url.search = ''; url.hash = ''
          components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Abrir Architect').setStyle(ButtonStyle.Link).setURL(url.href)))
        }
      } catch {}
      return interaction.editReply({ embeds: [embed], components, allowedMentions: { parse: [] } })
    } catch { return interaction.editReply({ content: 'No se pudo consultar la estructura o el borrador. Reintenta cuando el servicio esté disponible.' }) }
  },
}
