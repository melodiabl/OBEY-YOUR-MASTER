const { runTicketAction } = require('../../handlers/tickets/presentation')
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'remove',
  description: 'Remover un usuario del ticket actual',
  memberpermissions: ['ManageChannels'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a remover', required: true } },
  ],
  run: async (client, interaction) => runTicketAction(client, interaction, 'remove'),
}
