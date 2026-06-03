module.exports = {
  name: 'vdeafen',
  description: 'Ensordecer/desensordecer a un miembro en voz',
  memberpermissions: ['DeafenMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a ensordecer/desensordecer', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    const user = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const member = await interaction.guild.members.fetch(user.id).catch(() => null)
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true })
    if (!member.voice.channel) return interaction.reply({ content: '❌ El usuario no está en un canal de voz.', ephemeral: true })
    if (!interaction.guild.members.me.permissions.has('DeafenMembers'))
      return interaction.reply({ content: '❌ No tengo permisos para ensordecer miembros.', ephemeral: true })

    const isDeafened = member.voice.serverDeaf
    await member.voice.setDeaf(!isDeafened, reason)
    await interaction.reply({
      content: `✅ ${user} ha sido ${!isDeafened ? 'ensordecido' : 'desensordecido'} en voz. Razón: ${reason}`,
      ephemeral: true,
    })
  },
}
