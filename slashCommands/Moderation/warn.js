const obeyUi = require("../../handlers/assets/system")
const {nextCaseId}=require('../../handlers/moderation/cases')
const { EmbedBuilder } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')


module.exports = {
  name: 'warn',
  description: 'Advertir a un miembro del servidor',
  memberpermissions: ['KickMembers'],
  options: [
    { User:   { name: 'usuario', description: 'Miembro a advertir', required: true } },
    { String: { name: 'razon',   description: 'Razón',              required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))], ephemeral: true })

    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'

    if (target.id === interaction.user.id) return interaction.reply(err(obeyUi.owned('❌ No puedes advertirte a ti mismo.')))
    if (target.id === client.user.id)      return interaction.reply(err(obeyUi.owned('❌ No me puedo advertir a mí mismo.')))
    if (target.bot) return interaction.reply(err(obeyUi.owned('❌ No puedes advertir a un bot.')))

    const member = interaction.guild.members.cache.get(target.id)
    if (!member) return interaction.reply(err(obeyUi.owned('❌ Ese usuario no está en el servidor.')))
    if (interaction.guild.ownerId !== interaction.user.id &&
        member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply(err(obeyUi.owned('❌ No puedes advertir a alguien con un rol igual o superior al tuyo.')))

    await interaction.deferReply()

    const caseId = await nextCaseId(interaction.guild.id)
    await Moderation.create({
      guildId:     interaction.guild.id,
      userId:      target.id,
      action:      'warn',
      reason,
      moderatorId: interaction.user.id,
      caseId,
      active:      true,
    })

    const totalWarns = await Moderation.countDocuments({
      guildId: interaction.guild.id,
      userId:  target.id,
      action:  'warn',
      active:  true,
    })

    // DM al usuario
    await target.send({
      embeds: [new EmbedBuilder().setColor(0xFBBF24)
        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.warning")} Has recibido una advertencia en **${interaction.guild.name}**`, 256))
        .addFields(
          { name: obeyUi.owned('📋 Razón'),           value: reason,              inline: true },
          { name: obeyUi.owned('👮 Por'),              value: interaction.user.tag, inline: true },
          { name: obeyUi.owned('⚠️ Total advertencias'), value: `${totalWarns}`,   inline: true },
        )],
    }).catch(() => {})

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0xFBBF24)
        .setTitle(obeyUi.limit('⚠️ Advertencia registrada', 256))
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: obeyUi.owned('👤 Usuario'),           value: `${target} (${target.id})`, inline: true },
          { name: obeyUi.owned('👮 Mod'),               value: `${interaction.user}`,       inline: true },
          { name: obeyUi.owned('📋 Razón'),             value: reason,                      inline: false },
          { name: obeyUi.owned('🗂️ Caso'),             value: `#${caseId}`,                 inline: true },
          { name: obeyUi.owned('⚠️ Total en servidor'), value: `${totalWarns}`,             inline: true },
        )
        .setTimestamp()],
    })
  },
}
