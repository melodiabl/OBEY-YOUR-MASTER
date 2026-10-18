const { openFeedsSetup } = require('../../handlers/setup-feeds')

module.exports = {
  name: "setup-tiktok",
  category: "Setup",
  aliases: ["setuptiktok", "tiktok-setup", "tiktoksetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-tiktok',
  description: 'Configura canales, cuentas y mensajes de tiktok con cambios revisables.',
  run: (client, message) => openFeedsSetup(client, message, 'tiktok'),
}
