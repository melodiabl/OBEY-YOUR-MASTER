const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-reportlog",
  category: "Setup",
  aliases: ["setupreportlog", "cmdlog", "reportlog-setup", "reportlogsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-reportlog',
  description: 'Configura reportlog con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'reportlog'),
}
