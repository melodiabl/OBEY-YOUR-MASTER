const { openCommunitySetup } = require('../../handlers/setup-community')

module.exports = {
  name: "setup-boost",
  category: "Setup",
  aliases: ["setupboost", "boostsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-boost',
  description: 'Configura boost y revisa los cambios antes de guardar.',
  run: (client, message) => openCommunitySetup(client, message, 'boost'),
}
