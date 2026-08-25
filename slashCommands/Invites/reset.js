const { EmbedBuilder } = require('discord.js')
const User = require('../../database/schemas/UserSchema')
module.exports = {
  name: 'reset',
  description: 'Resetear las invitaciones de un usuario',
  memberpermissions: ['ManageGuild'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a resetear', required: true } },
  ],
  run: async (client, interaction) => {
    const ok = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const target = interaction.options.getUser('usuario')
    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guild.id },
      { invites: 0, fakeInvites: 0, leftInvites: 0, invitedBy: null }
    )
    await interaction.reply({ embeds: [ok(`🔄 Invitaciones de ${target} reseteadas a **0**.`)], ephemeral: true })
  },
}
