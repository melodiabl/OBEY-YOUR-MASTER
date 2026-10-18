const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-aichat",
  category: "Setup",
  aliases: ["setupaichat", "aichat-setup", "aichatsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-aichat',
  description: 'Configura aichat con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'aichat'),
}
