const { openMembershipSetup } = require('../../handlers/setup-membership')

module.exports = {
  name: "setup-welcome",
  category: "Setup",
  aliases: ["setupwelcome"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "info",
  usage: 'setup-welcome',
  description: 'Configura mensajes, imágenes y opciones de welcome con cambios revisables.',
  run: (client, message) => openMembershipSetup(client, message, 'welcome'),
}
