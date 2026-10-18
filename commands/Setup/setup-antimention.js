const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antimention",
  category: "Setup",
  aliases: ["setupantimention", "setup-mention", "setupmention", "antimention-setup", "antimentionsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antimention',
  description: 'Configura la protección antimention y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antimention'),
}
