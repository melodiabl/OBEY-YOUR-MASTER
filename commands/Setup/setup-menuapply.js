const { openSupportMenus } = require('../../handlers/setup-support-menus')
module.exports = {
  name: "setup-menuapply",
  category: "Setup",
  aliases: ["setupmenuapply", "menuapply-setup", "menuapplysetup", "menuapplysystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura menuapply con formularios y publicación de paneles.',
  usage: 'setup-menuapply',
  run: (client, message) => openSupportMenus(client, message, 'menuapply'),
}
