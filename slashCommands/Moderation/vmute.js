module.exports = {
  name: 'vmute',
  description: 'Silenciar/dessilenciar a un miembro en el canal de voz',
  memberpermissions: ['MuteMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a silenciar/dessilenciar', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    const user = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const member = await interaction.guild.members.fetch(user.id).catch(() => null)
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true })
    if (!member.voice.channel) return interaction.reply({ content: '❌ El usuario no está en un canal de voz.', ephemeral: true })
    if (!interaction.guild.members.me.permissions.has('MuteMembers'))
      return interaction.reply({ content: '❌ No tengo permisos de silenciar miembros.', ephemeral: true })

    const isMuted = member.voice.serverMute
    await member.voice.setMute(!isMuted, reason)
    await interaction.reply({
      content: `✅ ${user} ha sido ${!isMuted ? 'silenciado' : 'dessilenciado'} en voz. Razón: ${reason}`,
      ephemeral: true,
    })
  },
}
