const { openChannelSetup } = require('../../handlers/setup-channel')

module.exports = {
  name: "setup-dailyfact",
  category: "Setup",
  aliases: ["setupdailyfact", "cmdlog", "dailyfact-setup", "dailyfactsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-dailyfact',
  description: 'Configura dailyfact con cambios revisables antes de guardar.',
  run: (client, message) => openChannelSetup(client, message, 'dailyfact'),
}
