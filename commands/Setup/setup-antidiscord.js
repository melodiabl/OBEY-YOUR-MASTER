const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antidiscord",
  category: "Setup",
  aliases: ["setupantidiscord", "setup-mod", "setupmod", "antidiscord-setup", "antidiscordsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antidiscord',
  description: 'Configura la protección antidiscord y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antidiscord'),
}
