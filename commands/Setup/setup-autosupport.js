const { openSupportMenus } = require('../../handlers/setup-support-menus')
module.exports = {
  name: "setup-autosupport",
  category: "Setup",
  aliases: ["setupautosupport", "autosupport-setup", "autosupportsetup", "autosupportsystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura autosupport con formularios y publicación de paneles.',
  usage: 'setup-autosupport',
  run: (client, message) => openSupportMenus(client, message, 'autosupport'),
}
