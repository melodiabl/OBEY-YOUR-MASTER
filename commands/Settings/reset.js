const { runLegacyReset } = require('../../handlers/legacy-reset-command')
module.exports = {
  name: 'reset', aliases: ['hardreset'], category: 'Settings', memberpermissions: ['Administrator'], type: 'bot',
  description: 'Restablece prefijo, listas DJ y canales de comandos y referencias del panel antiguo. Solo el propietario.',
  usage: 'reset',
  run: (client, message, args) => runLegacyReset(client, message, args),
}
