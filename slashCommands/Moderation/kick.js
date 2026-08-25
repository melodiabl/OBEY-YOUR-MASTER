const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')

async function nextCaseId(guildId) {
  const last = await Moderation.findOne({ guildId }).sort({ caseId: -1 }).select('caseId').lean()
  return (last?.caseId || 0) + 1
}

module.exports = {
  name: 'kick',
  description: 'Expulsar a un miembro del servidor',
  memberpermissions: ['KickMembers'],
  options: [
    { User:   { name: 'usuario', description: 'Miembro a expulsar', required: true } },
    { String: { name: 'razon',   description: 'Razón',              required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(d)], ephemeral: true })

    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'

    if (target.id === interaction.user.id) return interaction.reply(err('❌ No puedes expulsarte a ti mismo.'))
    if (target.id === client.user.id)      return interaction.reply(err('❌ No me puedo expulsar a mí mismo.'))

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers))
      return interaction.reply(err('❌ No tengo el permiso de **Expulsar Miembros**.'))

    const member = interaction.guild.members.cache.get(target.id)
    if (!member) return interaction.reply(err('❌ Ese usuario no está en el servidor.'))
    if (!member.kickable)
      return interaction.reply(err('❌ No puedo expulsar a ese miembro.'))
    if (interaction.guild.ownerId !== interaction.user.id &&
        member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply(err('❌ No puedes expulsar a alguien con un rol igual o superior al tuyo.'))

    await interaction.deferReply()

    await target.send({
      embeds: [new EmbedBuilder().setColor(0xF97316)
        .setTitle(`👢 Has sido expulsado de **${interaction.guild.name}**`)
        .addFields(
          { name: '📋 Razón', value: reason,              inline: true },
          { name: '👮 Por',   value: interaction.user.tag, inline: true },
        )],
    }).catch(() => {})

    try {
      await member.kick(reason)

      const caseId = await nextCaseId(interaction.guild.id)
      await Moderation.create({
        guildId:     interaction.guild.id,
        userId:      target.id,
        action:      'kick',
        reason,
        moderatorId: interaction.user.id,
        caseId,
        active:      false,
      })

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xF97316)
          .setTitle('👢 Miembro expulsado')
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '👤 Usuario', value: `${target} (${target.id})`, inline: true },
            { name: '👮 Mod',     value: `${interaction.user}`,       inline: true },
            { name: '📋 Razón',   value: reason,                      inline: false },
            { name: '🗂️ Caso',   value: `#${caseId}`,                 inline: true },
          )
          .setTimestamp()],
      })
    } catch (e) {
      await interaction.editReply(err(`❌ Error al expulsar: ${e.message}`))
    }
  },
}
