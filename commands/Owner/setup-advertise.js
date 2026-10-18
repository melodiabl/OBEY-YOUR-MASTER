const { openOwnerSetup } = require('../../handlers/setup-owner-settings')
module.exports = {
  name: "setup-advertise",
  category: "Owner",
  aliases: ["setup-advert", "setupadvertise", "setupadvert"],
  cooldown: 5,
  type: "bot",
  description: 'Administra la publicidad del bot con guardado confirmado.',
  usage: 'setup-advertise',
  run: (client, message) => openOwnerSetup(client, message, 'advertisement'),
}
