const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-ghost-ping-detector",
  category: "Setup",
  aliases: [
        "setupghost-ping-detector",
        "ghost-ping-detector-setup",
        "ghost-ping-detectorsetup",
        "setup-ghost-ping",
        "setup-ghostping",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-ghost-ping-detector',
  description: 'Configura la protección ghost y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'ghost'),
}
