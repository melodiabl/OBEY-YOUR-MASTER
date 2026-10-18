const { openFeedsSetup } = require('../../handlers/setup-feeds')

module.exports = {
  name: "setup-twitter",
  category: "Setup",
  aliases: ["setuptwitter", "twitter-setup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-twitter',
  description: 'Configura canales, cuentas y mensajes de twitter con cambios revisables.',
  run: (client, message) => openFeedsSetup(client, message, 'twitter'),
}
