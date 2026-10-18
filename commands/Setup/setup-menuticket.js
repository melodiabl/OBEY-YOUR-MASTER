const { openSupportMenus } = require('../../handlers/setup-support-menus')
module.exports = {
  name: "setup-menuticket",
  category: "Setup",
  aliases: ["setupmenuticket", "menuticket-setup", "menuticketsetup", "menuticketsystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura menuticket con formularios y publicación de paneles.',
  usage: 'setup-menuticket',
  run: (client, message) => openSupportMenus(client, message, 'menuticket'),
}
