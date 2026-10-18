const { openEmbedSetup } = require('../../handlers/setup-embed')

module.exports = {
  name: "setup-embed",
  category: "Setup",
  aliases: ["setupembed", "embed-setup", "embedsetup"],
  cooldown: 5,
  usage: "setup-embed",
  description: "Edita la apariencia y previsualiza antes de guardar",
  memberpermissions: ['Administrador'],
  type: "info",
  run: (client, message) => openEmbedSetup(client, message),
}
