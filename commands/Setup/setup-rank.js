const { openRoleSettings } = require('../../handlers/setup-role-settings')

module.exports = {
  name: "setup-rank",
  category: "Setup",
  aliases: [
        "setuprank",
        "rank-setup",
        "setup-level",
        "setup-levels",
        "setup-leveling",
        "setuplevel",
        "setuplevels",
        "setupleveling",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-rank',
  description: 'Configura rank con cambios revisables antes de guardar.',
  run: (client, message) => openRoleSettings(client, message, 'rank'),
}
