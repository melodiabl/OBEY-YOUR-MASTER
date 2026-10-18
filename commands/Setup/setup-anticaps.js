const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-anticaps",
  category: "Setup",
  aliases: ["setupanticaps", "setup-caps", "setupcaps", "anticaps-setup", "anticapssetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-anticaps',
  description: 'Configura la protección anticaps y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'anticaps'),
}
