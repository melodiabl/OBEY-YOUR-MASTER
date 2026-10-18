const { openCategorySetup } = require('../../handlers/setup-command-categories')

module.exports = {
  name: "setup-commands",
  category: "Setup",
  aliases: ["setupcommands", "setup-command", "setupcommand"],
  cooldown: 5,
  usage: "setup-commands",
  description: "Activa o desactiva categorías de comandos con guardado explícito",
  memberpermissions: ['Administrador'],
  type: "info",
  run: (client, message) => openCategorySetup(client, message),
}
