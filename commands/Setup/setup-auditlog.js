const { openLogSetup } = require('../../handlers/setup-logs')

module.exports = {
  name: "setup-auditlog",
  category: "Setup",
  aliases: ["setupauditlog", "auditlog-setup", "auditlogsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-auditlog',
  description: 'Configura destinos, categorías y privacidad de los registros.',
  run: (client, message) => openLogSetup(client, message),
}
