const { runGlobalReset } = require('../../handlers/global-reset-command')
module.exports = {
  name: 'resetsettings', type: 'info', category: 'Owner', aliases: ['resetallsettings', 'hardreset'], cooldown: 5,
  usage: 'resetsettings', description: 'El propietario del bot elige restablecer configuración o añadir datos locales del servidor.',
  run: (client, message, args) => runGlobalReset(client, message, args),
}
