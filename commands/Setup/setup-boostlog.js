const { openCommunitySetup } = require('../../handlers/setup-community')

module.exports = {
  name: "setup-boostlog",
  category: "Setup",
  aliases: ["setupboostlog", "boostlogsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-boostlog',
  description: 'Configura boostlog y revisa los cambios antes de guardar.',
  run: (client, message) => openCommunitySetup(client, message, 'boostlog'),
}
