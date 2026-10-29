const { runOwnerOperation } = require('../../handlers/owner-operations-command')
module.exports = {
  name: 'restartbot', category: 'Owner', aliases: ['botrestart'], cooldown: 5, usage: 'restartbot', type: 'bot',
  description: 'El dueño solicita un reinicio controlado tras confirmar la desconexión del bot.',
  run: (client, message, args) => runOwnerOperation(client, message, args, 'restart'),
}
