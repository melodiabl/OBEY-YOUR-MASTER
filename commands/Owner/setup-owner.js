const { openOwnerSetup } = require('../../handlers/setup-owner-settings')
module.exports = {
  name: "setup-owner",
  category: "Owner",
  aliases: ["setup-owners", "setupowner", "setupowners"],
  cooldown: 5,
  type: "info",
  description: 'Administra los propietarios del bot con guardado confirmado.',
  usage: 'setup-owner',
  run: (client, message) => openOwnerSetup(client, message, 'owners'),
}
