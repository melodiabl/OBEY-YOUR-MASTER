const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'close',
  description: 'Cerrar el ticket actual',
  options: [
    { String: { name: 'razon', description: 'Razón del cierre', required: false } },
  ],
  run: async (client, interaction) => {
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' })

    if (!ticket) {
      // Check if it looks like a ticket channel from the Enmap system
      if (!interaction.channel.name?.includes('ticket') && !interaction.channel.topic?.includes('ticket'))
        return interaction.reply({ content: '❌ Este canal no es un ticket.', ephemeral: true })
    }

    // Permissions: ticket owner or staff
    const isOwner = ticket ? ticket.userId === interaction.user.id : false
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)
    if (!isOwner && !isStaff)
      return interaction.reply({ content: '❌ Solo el dueño del ticket o staff pueden cerrarlo.', ephemeral: true })

    await interaction.reply({ content: `🔒 Cerrando ticket... Razón: **${reason}**` })

    if (ticket) {
      ticket.status = 'closed'
      await ticket.save()
    }

    // Send close embed then delete channel after delay
    const embed = new EmbedBuilder()
      .setTitle('🔒 Ticket Cerrado')
      .setDescription(`Cerrado por ${interaction.user}\nRazón: ${reason}`)
      .setColor('#FF6B35')
      .setTimestamp()

    const logChannelId = client.settings?.get(interaction.guild.id, 'ticketlogchannel')
    if (logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId)
      if (logChannel) {
        embed.addFields({ name: 'Canal', value: interaction.channel.name })
        await logChannel.send({ embeds: [embed] }).catch(() => {})
      }
    }

    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  },
}
