const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'claim',
  description: 'Reclamar este ticket como moderador',
  memberpermissions: ['ManageChannels'],
  options: [],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' })
    if (!ticket && !interaction.channel.name?.includes('ticket'))
      return interaction.reply({ embeds: [err('❌ Este canal no es un ticket.')], ephemeral: true })

    if (ticket?.claimedBy)
      return interaction.reply({ embeds: [err(`❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`)], ephemeral: true })

    if (ticket) {
      ticket.claimedBy = interaction.user.id
      ticket.status = 'claimed'
      await ticket.save()
    }

    await interaction.reply({ embeds: [ok(`🎫 ${interaction.user} ha **reclamado** este ticket.`)] })
  },
}
