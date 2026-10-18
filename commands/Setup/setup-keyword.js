const { openAutomationSetup } = require('../../handlers/setup-automation')

module.exports = {
  name: "setup-keyword",
  category: "Setup",
  aliases: ["setupkeyword", "keyword-setup", "setup-keyword"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-keyword',
  description: 'Crea y edita keyword con un formulario y guarda los cambios al terminar.',
  run: (client, message) => openAutomationSetup(client, message, 'keyword'),
}
