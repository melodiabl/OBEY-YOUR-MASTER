const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-auditlog",
  category: "Setup",
  aliases: ["setupauditlog", "auditlog-setup", "auditlogsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-auditlog',
  description: 'Configura logger con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'logger'),
}
