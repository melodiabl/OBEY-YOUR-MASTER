const { openAutomationSetup } = require('../../handlers/setup-automation')

module.exports = {
  name: "setup-autodelete",
  category: "Setup",
  aliases: ["setupautodelete", "autodelete-setup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-autodelete',
  description: 'Crea y edita autodelete con un formulario y guarda los cambios al terminar.',
  run: (client, message) => openAutomationSetup(client, message, 'autodelete'),
}
