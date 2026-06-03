const { PermissionFlagsBits } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'remove',
  description: 'Remover un usuario del ticket actual',
  memberpermissions: ['ManageChannels'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a remover', required: true } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario')
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado en este servidor.', ephemeral: true })

    const ticket = await Ticket.findOne({ channelId: interaction.channel.id })
    if (!ticket && !interaction.channel.name?.includes('ticket'))
      return interaction.reply({ content: '❌ Este canal no parece ser un ticket.', ephemeral: true })

    if (ticket && ticket.userId === target.id)
      return interaction.reply({ content: '❌ No puedes remover al dueño del ticket.', ephemeral: true })

    await interaction.channel.permissionOverwrites.delete(member)
    await interaction.reply({ content: `✅ ${target} fue removido del ticket.` })
  },
}
