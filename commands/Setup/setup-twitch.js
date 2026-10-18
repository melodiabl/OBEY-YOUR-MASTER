const { openFeedsSetup } = require('../../handlers/setup-feeds')

module.exports = {
  name: "setup-twitch",
  category: "Setup",
  aliases: ["setuptwitch", "twitch-setup", "twitchsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-twitch',
  description: 'Configura canales, cuentas y mensajes de twitch con cambios revisables.',
  run: (client, message) => openFeedsSetup(client, message, 'twitch'),
}
