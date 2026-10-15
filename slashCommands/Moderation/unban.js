const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')

module.exports = {
  name: 'unban',
  description: 'Desbanear a un usuario por su ID',
  memberpermissions: ['BanMembers'],
  options: [
    { String: { name: 'user_id', description: 'ID del usuario baneado', required: true } },
    { String: { name: 'razon',   description: 'Razón del desbaneo',     required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))], ephemeral: true })

    const userId = interaction.options.getString('user_id')
    const reason = interaction.options.getString('razon') || 'Sin razón'

    if (!/^\d{17,20}$/.test(userId))
      return interaction.reply(err(obeyUi.owned('❌ ID inválida. Debe ser el ID numérico del usuario.')))

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
      return interaction.reply(err(obeyUi.owned('❌ No tengo el permiso de **Banear Miembros**.')))

    await interaction.deferReply()

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null)
      if (!ban) return interaction.editReply(err(obeyUi.owned('❌ Ese usuario no está baneado en este servidor.')))

      await interaction.guild.members.unban(userId, reason)

      // Marcar el ban como inactivo en la BD
      await Moderation.updateMany(
        { guildId: interaction.guild.id, userId, action: 'ban', active: true },
        { $set: { active: false } }
      )

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x22C55E)
          .setTitle(obeyUi.limit('✅ Usuario desbaneado', 256))
          .setThumbnail(ban.user.displayAvatarURL())
          .addFields(
            { name: obeyUi.owned('👤 Usuario'), value: `${ban.user.tag} (${userId})`, inline: true },
            { name: obeyUi.owned('👮 Mod'),     value: `${interaction.user}`,          inline: true },
            { name: obeyUi.owned('📋 Razón'),   value: reason,                         inline: false },
          )
          .setTimestamp()],
      })
    } catch (e) {
      await interaction.editReply(err(`${obeyUi.markup("icon.error")} Error: ${e.message}`))
    }
  },
}
