const { runTicketAction } = require('../../handlers/tickets/presentation')
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const Ticket = require('../../database/schemas/TicketSchema')
module.exports = {
  name: 'claim',
  description: 'Reclamar este ticket como moderador',
  memberpermissions: ['ManageChannels'],
  options: [],
  run: async (client, interaction) => runTicketAction(client, interaction, 'claim'),
}
