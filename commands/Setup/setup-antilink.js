const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antilink",
  category: "Setup",
  aliases: ["setupantilink", "antilinks-setup", "antilink-setup", "antilinksetup", "setup-antilinks"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antilink',
  description: 'Configura la protección antilink y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antilink'),
}
