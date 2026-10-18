const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antispam",
  category: "Setup",
  aliases: ["setupantispam", "setup-spam", "setupspam", "antispam-setup", "antispamsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antispam',
  description: 'Configura la protección antispam y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antispam'),
}
