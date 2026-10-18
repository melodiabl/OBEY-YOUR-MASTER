const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antimasspings",
  category: "Setup",
  aliases: ["setupantimasspings", "setup-masspings", "setupmasspings", "antimasspings-setup", "antimasspingssetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antimasspings',
  description: 'Configura la protección antimention y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antimention'),
}
