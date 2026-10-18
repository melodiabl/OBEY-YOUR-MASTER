const { openRoleResources } = require('../../handlers/setup-role-resources')

module.exports = {
  name: "setup-membercount",
  category: "Setup",
  aliases: ["setupmembercount", "membercount-setup", "membercountsetup", "setup-membercounter", "setupmembercounter"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-membercount',
  description: 'Configura membercount, revisa el resultado y publica los cambios guardados.',
  run: (client, message) => openRoleResources(client, message, 'membercount'),
}
