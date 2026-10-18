const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antipings",
  category: "Setup",
  aliases: ["setupantipings", "setup-pings", "setuppings", "antipings-setup", "antipingssetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antipings',
  description: 'Configura la protección antimention y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antimention'),
}
