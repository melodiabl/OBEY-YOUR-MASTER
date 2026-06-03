const User = require('../../database/schemas/UserSchema')
module.exports = {
  name: 'reset',
  description: 'Resetear las invitaciones de un usuario',
  memberpermissions: ['ManageGuild'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a resetear', required: true } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario')
    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guild.id },
      { invites: 0, fakeInvites: 0, leftInvites: 0, invitedBy: null }
    )
    await interaction.reply({ content: `✅ Invitaciones de ${target} reseteadas.`, ephemeral: true })
  },
}
