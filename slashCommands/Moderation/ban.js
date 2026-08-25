const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')

async function nextCaseId(guildId) {
  const last = await Moderation.findOne({ guildId }).sort({ caseId: -1 }).select('caseId').lean()
  return (last?.caseId || 0) + 1
}

module.exports = {
  name: 'ban',
  description: 'Banear a un miembro del servidor',
  memberpermissions: ['BanMembers'],
  options: [
    { User:    { name: 'usuario', description: 'Miembro a banear', required: true } },
    { String:  { name: 'razon',   description: 'Razón del ban',    required: false } },
    { Integer: { name: 'dias',    description: 'Días de mensajes a eliminar (0-7, por defecto 0)', required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(d)], ephemeral: true })

    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const days   = Math.min(7, Math.max(0, interaction.options.getInteger('dias') || 0))

    if (target.id === interaction.user.id)
      return interaction.reply(err('❌ No puedes banearte a ti mismo.'))
    if (target.id === client.user.id)
      return interaction.reply(err('❌ No me puedo banear a mí mismo.'))

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
      return interaction.reply(err('❌ No tengo el permiso de **Banear Miembros**.'))

    const member = interaction.guild.members.cache.get(target.id)
    if (member) {
      if (!member.bannable)
        return interaction.reply(err('❌ No puedo banear a ese miembro (rol más alto que el mío).'))
      if (interaction.guild.ownerId !== interaction.user.id &&
          member.roles.highest.position >= interaction.member.roles.highest.position)
        return interaction.reply(err('❌ No puedes banear a alguien con un rol igual o superior al tuyo.'))
    }

    await interaction.deferReply()

    // DM antes de banear
    if (member) {
      await target.send({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle(`🔨 Has sido baneado de **${interaction.guild.name}**`)
          .addFields(
            { name: '📋 Razón',    value: reason,              inline: true },
            { name: '👮 Por',       value: interaction.user.tag, inline: true },
          )],
      }).catch(() => {})
    }

    try {
      await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds: days * 86400 })

      const caseId = await nextCaseId(interaction.guild.id)
      await Moderation.create({
        guildId:     interaction.guild.id,
        userId:      target.id,
        action:      'ban',
        reason,
        moderatorId: interaction.user.id,
        caseId,
        active:      true,
      })

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle('🔨 Miembro baneado')
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '👤 Usuario',  value: `${target} (${target.id})`,  inline: true },
            { name: '👮 Mod',      value: `${interaction.user}`,        inline: true },
            { name: '📋 Razón',    value: reason,                       inline: false },
            { name: '🗂️ Caso',    value: `#${caseId}`,                  inline: true },
            { name: '🗑️ Mensajes', value: `${days} día(s)`,             inline: true },
          )
          .setTimestamp()],
      })
    } catch (e) {
      await interaction.editReply(err(`❌ Error al banear: ${e.message}`))
    }
  },
}
