const { openToggleSetup } = require('../../handlers/setup-command-categories')

module.exports = {
  name: "setup-validcode",
  category: "Setup",
  aliases: ["setupvalidcode", "validcode-setup", "validcodesetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-validcode',
  description: 'Configura validcode con cambios revisables antes de guardar.',
  run: (client, message) => openToggleSetup(client, message, 'validcode'),
}
