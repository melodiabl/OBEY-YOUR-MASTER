const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const AuditLogSchema = require('../../database/schemas/AuditLogSchema')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'logs',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.LOGS_VIEW],
  CMD: new SlashCommandBuilder()
    .setName('audit-latest')
    .setDescription('Muestra los ultimos eventos de auditoria (DB)')
    .addIntegerOption(o =>
      o
        .setName('limite')
        .setDescription('Cantidad (max 20)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addUserOption(o =>
      o
        .setName('actor')
        .setDescription('Filtra por actor')
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName('accion')
        .setDescription('Filtra por accion exacta (ej: slash.ping)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const limit = interaction.options.getInteger('limite') || 10
    const actor = interaction.options.getUser('actor')
    const action = interaction.options.getString('accion')

    const query = { guildID: interaction.guild.id }
    if (actor) query.actorID = actor.id
    if (action) query.action = action

    const rows = await AuditLogSchema.find(query).sort({ createdAt: -1 }).limit(limit)
    if (!rows.length) return interaction.reply({ content: 'No hay registros con esos filtros.', ephemeral: true })

    const embed = new EmbedBuilder()
      .setTitle('Auditoria (ultimos eventos)')
      .setColor('Blurple')
      .setTimestamp()

    const lines = rows.map(r => {
      const ts = `<t:${Math.floor(new Date(r.createdAt).getTime() / 1000)}:R>`
      const ok = r.ok ? '✅' : '❌'
      return `${ok} ${ts} \`${r.action}\` por <@${r.actorID}>`
    })

    embed.setDescription(lines.join('\n'))
    return interaction.reply({ embeds: [embed], ephemeral: true })
  }
}
