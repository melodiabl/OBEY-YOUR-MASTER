const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'vmute',
  description: 'Silenciar/dessilenciar a un miembro en el canal de voz',
  memberpermissions: ['MuteMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a silenciar/dessilenciar', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const user = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const member = await interaction.guild.members.fetch(user.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [err('❌ Usuario no encontrado.')], ephemeral: true })
    if (!member.voice.channel) return interaction.reply({ embeds: [err('❌ El usuario no está en un canal de voz.')], ephemeral: true })
    if (!interaction.guild.members.me.permissions.has('MuteMembers'))
      return interaction.reply({ embeds: [err('❌ No tengo permisos de silenciar miembros.')], ephemeral: true })

    const isMuted = member.voice.serverMute
    await member.voice.setMute(!isMuted, reason)
    await interaction.reply({
      embeds: [ok(`${!isMuted ? '🔇' : '🔊'} ${user} ha sido **${!isMuted ? 'silenciado' : 'dessilenciado'}** en voz.\n> Razón: ${reason}`)],
      ephemeral: true,
    })
  },
}
