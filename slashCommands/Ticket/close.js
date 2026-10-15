const { runTicketAction } = require('../../handlers/tickets/presentation')
const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'close',
  description: 'Cerrar el ticket actual',
  options: [
    { String: { name: 'razon', description: 'Razón del cierre', required: false } },
  ],
  run: async (client, interaction) => runTicketAction(client, interaction, 'close'),
}
