const { openRoleResources } = require('../../handlers/setup-role-resources')

module.exports = {
  name: "setup-serverstats",
  category: "Setup",
  aliases: ["setupserverstats", "serverstats-setup", "serverstatssetup", "setup-serverstatser", "setupserverstatser"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-serverstats',
  description: 'Configura membercount, revisa el resultado y publica los cambios guardados.',
  run: (client, message) => openRoleResources(client, message, 'membercount'),
}
