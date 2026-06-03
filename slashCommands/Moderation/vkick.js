module.exports = {
  name: 'vkick',
  description: 'Desconectar a un miembro de su canal de voz',
  memberpermissions: ['MoveMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a desconectar', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    const user = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const member = await interaction.guild.members.fetch(user.id).catch(() => null)
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true })
    if (!member.voice.channel) return interaction.reply({ content: '❌ El usuario no está en un canal de voz.', ephemeral: true })
    if (!interaction.guild.members.me.permissions.has('MoveMembers'))
      return interaction.reply({ content: '❌ No tengo permisos para mover miembros.', ephemeral: true })

    await member.voice.disconnect(reason)
    await interaction.reply({ content: `✅ ${user} fue desconectado del canal de voz. Razón: ${reason}`, ephemeral: true })
  },
}
