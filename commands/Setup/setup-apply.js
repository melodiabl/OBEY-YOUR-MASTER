const { openSupportSetup } = require('../../handlers/setup-support')
module.exports = {
  name: "setup-apply",
  category: "Setup",
  aliases: ["setupapply", "apply-setup", "applysetup", "setup-application", "setupapplication"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura apply con formularios y publicación de paneles.',
  usage: 'setup-apply',
  run: (client, message) => openSupportSetup(client, message, 'apply'),
}
