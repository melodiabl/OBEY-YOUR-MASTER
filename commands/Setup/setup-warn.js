const { openRoleSettings } = require('../../handlers/setup-role-settings')

module.exports = {
  name: "setup-warn",
  category: "Setup",
  aliases: ["setupwarn", "warn-setup", "warnsetup", "warnsystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-warn',
  description: 'Configura warn con cambios revisables antes de guardar.',
  run: (client, message) => openRoleSettings(client, message, 'warn'),
}
