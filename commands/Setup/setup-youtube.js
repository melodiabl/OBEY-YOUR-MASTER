const { openFeedsSetup } = require('../../handlers/setup-feeds')

module.exports = {
  name: "setup-youtube",
  category: "Setup",
  aliases: ["setupyoutube", "youtube-setup", "youtubesetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-youtube',
  description: 'Configura canales, cuentas y mensajes de youtube con cambios revisables.',
  run: (client, message) => openFeedsSetup(client, message, 'youtube'),
}
