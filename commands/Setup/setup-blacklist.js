const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-blacklist",
  category: "Setup",
  aliases: ["setupblacklist", "blacklist-setup", "blacklistsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-blacklist',
  description: 'Configura la protección blacklist y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'blacklist'),
}
