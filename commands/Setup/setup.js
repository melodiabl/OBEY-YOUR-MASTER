const { openSetup } = require('../../handlers/setup-navigation')

module.exports = {
  name: 'setup',
  category: 'Setup',
  aliases: [],
  cooldown: 5,
  usage: 'setup',
  description: 'Abre la configuración del servidor por categorías',
  memberpermissions: ['Administrador'],
  type: 'info',
  run: (client, message) => openSetup(client, message),
}
