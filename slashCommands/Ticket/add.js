const { runTicketAction } = require('../../handlers/tickets/presentation')
const { PermissionFlagsBits, OverwriteType, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'add',
  description: 'Agregar un usuario al ticket actual',
  memberpermissions: ['ManageChannels'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a agregar', required: true } },
  ],
  run: async (client, interaction) => runTicketAction(client, interaction, 'add'),
}
