const { openLogSetup } = require('../../handlers/setup-logs')

module.exports = {
  name: "setup-logger",
  category: "Setup",
  aliases: ["setuplogger", "logger-setup", "loggersetup", "setup-auditlog"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-logger',
  description: 'Configura destinos, categorías y privacidad de los registros.',
  run: (client, message) => openLogSetup(client, message),
}
