const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-mute",
  category: "Setup",
  aliases: ["setupmute", "mute-setup", "mutesetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-mute',
  description: 'Configura la protección mute y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'mute'),
}
