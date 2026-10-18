const { PermissionFlagsBits } = require('discord.js')
const { openSlashSetup } = require('../handlers/setup-navigation')

module.exports = {
  name: 'setup',
  category: 'Config',
  description: 'Configura tu servidor desde un único panel guiado.',
  guildOnly: true,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  memberpermissions: ['Administrator'],
  cooldown: 5,
  run: (client, interaction) => openSlashSetup(client, interaction),
}
