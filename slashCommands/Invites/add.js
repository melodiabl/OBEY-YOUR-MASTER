const User = require('../../database/schemas/UserSchema')
module.exports = {
  name: 'add',
  description: 'Agregar invitaciones a un usuario manualmente',
  memberpermissions: ['ManageGuild'],
  options: [
    { User: { name: 'usuario', description: 'Usuario objetivo', required: true } },
    { Integer: { name: 'cantidad', description: 'Invitaciones a agregar', required: true } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario')
    const amount = interaction.options.getInteger('cantidad')
    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guild.id },
      { $inc: { invites: amount }, $setOnInsert: { userId: target.id, guildId: interaction.guild.id } },
      { upsert: true }
    )
    await interaction.reply({ content: `✅ +${amount} invitaciones agregadas a ${target}.`, ephemeral: true })
  },
}
