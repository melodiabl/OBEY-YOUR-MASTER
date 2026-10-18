const { openToggleSetup } = require('../../handlers/setup-command-categories')

module.exports = {
  name: "setup-autowarn",
  category: "Setup",
  aliases: ["setupautowarn", "autowarn-setup", "autowarnsetup", "autowarnsystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-autowarn',
  description: 'Configura autowarn con cambios revisables antes de guardar.',
  run: (client, message) => openToggleSetup(client, message, 'autowarn'),
}
