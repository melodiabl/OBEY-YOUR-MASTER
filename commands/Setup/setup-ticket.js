const { openSupportSetup } = require('../../handlers/setup-support')
module.exports = {
  name: "setup-ticket",
  category: "Setup",
  aliases: ["setupticket", "ticket-setup", "ticketsetup", "ticketsystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura ticket con formularios y publicación de paneles.',
  usage: 'setup-ticket',
  run: (client, message) => openSupportSetup(client, message, 'ticket'),
}
