const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-automeme",
  category: "Setup",
  aliases: ["setupautomeme", "cmdlog", "automeme-setup", "automemesetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-automeme',
  description: 'Configura automeme con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'automeme'),
}
