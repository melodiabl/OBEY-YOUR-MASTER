const { openCommunitySetup } = require('../../handlers/setup-community')

module.exports = {
  name: "setup-autoembed",
  category: "Setup",
  aliases: ["setupautoembed", "autoembed-setup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-autoembed',
  description: 'Configura autoembed y revisa los cambios antes de guardar.',
  run: (client, message) => openCommunitySetup(client, message, 'autoembed'),
}
