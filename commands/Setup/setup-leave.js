const { openMembershipSetup } = require('../../handlers/setup-membership')

module.exports = {
  name: "setup-leave",
  category: "Setup",
  aliases: ["setupleave"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "info",
  usage: 'setup-leave',
  description: 'Configura mensajes, imágenes y opciones de leave con cambios revisables.',
  run: (client, message) => openMembershipSetup(client, message, 'leave'),
}
