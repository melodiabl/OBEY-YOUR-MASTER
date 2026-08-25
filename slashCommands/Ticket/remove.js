const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'remove',
  description: 'Remover un usuario del ticket actual',
  memberpermissions: ['ManageChannels'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a remover', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const target = interaction.options.getUser('usuario')
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [err('❌ Usuario no encontrado en este servidor.')], ephemeral: true })

    const ticket = await Ticket.findOne({ channelId: interaction.channel.id })
    if (!ticket && !interaction.channel.name?.includes('ticket'))
      return interaction.reply({ embeds: [err('❌ Este canal no parece ser un ticket.')], ephemeral: true })

    if (ticket && ticket.userId === target.id)
      return interaction.reply({ embeds: [err('❌ No puedes remover al dueño del ticket.')], ephemeral: true })

    await interaction.channel.permissionOverwrites.delete(member)
    await interaction.reply({ embeds: [ok(`✅ ${target} fue **removido** del ticket.`)] })
  },
}
