const { PermissionFlagsBits } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'claim',
  description: 'Reclamar este ticket como moderador',
  memberpermissions: ['ManageChannels'],
  options: [],
  run: async (client, interaction) => {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' })
    if (!ticket && !interaction.channel.name?.includes('ticket'))
      return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true })

    if (ticket?.claimedBy)
      return interaction.reply({ content: `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`, ephemeral: true })

    if (ticket) {
      ticket.claimedBy = interaction.user.id
      ticket.status = 'claimed'
      await ticket.save()
    }

    await interaction.reply({ content: `✅ ${interaction.user} ha reclamado este ticket.` })
  },
}
