const { PermissionFlagsBits, OverwriteType } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'add',
  description: 'Agregar un usuario al ticket actual',
  memberpermissions: ['ManageChannels'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a agregar', required: true } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario')
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado en este servidor.', ephemeral: true })

    const ticket = await Ticket.findOne({ channelId: interaction.channel.id })
    if (!ticket && !interaction.channel.name?.includes('ticket'))
      return interaction.reply({ content: '❌ Este canal no parece ser un ticket.', ephemeral: true })

    await interaction.channel.permissionOverwrites.edit(member, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    })
    await interaction.reply({ content: `✅ ${target} fue agregado al ticket.` })
  },
}
