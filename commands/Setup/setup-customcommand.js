const { openAutomationSetup } = require('../../handlers/setup-automation')

module.exports = {
  name: "setup-customcommand",
  category: "Setup",
  aliases: ["setupcustomcommand", "setupcustomcommands", "customcommand-setup", "setup-customcommands"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-customcommand',
  description: 'Crea y edita customcommand con un formulario y guarda los cambios al terminar.',
  run: (client, message) => openAutomationSetup(client, message, 'customcommand'),
}
