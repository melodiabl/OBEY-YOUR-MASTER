const { PermissionFlagsBits } = require('discord.js')
const { unbanUser, unbanReply } = require('../../handlers/moderation/action')
const { t, localeFor } = require('../../handlers/i18n')

module.exports = {
  name: 'unban',
  description: 'Desbanear a un usuario por su ID',
  memberpermissions: ['BanMembers'],
  options: [
    { String: { name: 'user_id', description: 'ID del usuario baneado', required: true } },
    { String: { name: 'razon', description: 'Razón del desbaneo', required: false } },
  ],
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const locale = localeFor(client, interaction.guild.id)
    const result = await unbanUser(client, {
      guild: interaction.guild,
      actorId: interaction.user.id,
      userId: interaction.options.getString('user_id'),
      actorPermission: PermissionFlagsBits.BanMembers,
      reason: interaction.options.getString('razon') || t(locale, 'moderation.noReason'),
    })
    return interaction.editReply(unbanReply(result, locale))
  },
}
