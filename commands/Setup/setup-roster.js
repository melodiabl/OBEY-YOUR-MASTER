const { openRoleResources } = require('../../handlers/setup-role-resources')

module.exports = {
  name: "setup-roster",
  category: "Setup",
  aliases: ["setuproster", "roster-setup", "rostersetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-roster',
  description: 'Configura roster, revisa el resultado y publica los cambios guardados.',
  run: (client, message) => openRoleResources(client, message, 'roster'),
}
