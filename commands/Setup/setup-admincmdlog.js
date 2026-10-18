const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-admincmdlog",
  category: "Setup",
  aliases: ["setupadmincmdlog", "cmdlog", "admincmdlog-setup", "admincmdlogsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "info",
  usage: 'setup-admincmdlog',
  description: 'Configura adminlog con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'adminlog'),
}
