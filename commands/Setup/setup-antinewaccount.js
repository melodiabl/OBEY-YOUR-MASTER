const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antinewaccount",
  category: "Setup",
  aliases: [
        "setupnewaccount",
        "newaccount-setup",
        "newaccountsetup",
        "setupantinewaccount",
        "antinewaccount-setup",
        "antinewaccountsetup",
        "setup-newaccount",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antinewaccount',
  description: 'Configura la protección antinewaccount y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antinewaccount'),
}
