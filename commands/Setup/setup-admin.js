const { openRoleSettings } = require('../../handlers/setup-role-settings')

module.exports = {
  name: "setup-admin",
  category: "Setup",
  aliases: ["setupadmin", "setup-mod", "setupmod", "admin-setup", "adminsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "info",
  usage: 'setup-admin',
  description: 'Configura admin con cambios revisables antes de guardar.',
  run: (client, message) => openRoleSettings(client, message, 'admin'),
}
