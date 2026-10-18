const { openToggleSetup } = require('../../handlers/setup-command-categories')

module.exports = {
  name: "setup-autobackup",
  category: "Setup",
  aliases: ["setupautobackup", "setup-backup", "setupbackup", "autobackup-setup", "autobackupsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-autobackup',
  description: 'Configura autobackup con cambios revisables antes de guardar.',
  run: (client, message) => openToggleSetup(client, message, 'autobackup'),
}
