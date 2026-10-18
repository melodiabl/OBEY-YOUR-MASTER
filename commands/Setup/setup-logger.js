const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-logger",
  category: "Setup",
  aliases: ["setuplogger", "logger-setup", "loggersetup", "setup-auditlog"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-logger',
  description: 'Configura logger con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'logger'),
}
