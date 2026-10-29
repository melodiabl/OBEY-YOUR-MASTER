const { runOwnerOperation } = require('../../handlers/owner-operations-command')
module.exports = {
  name: 'stopbot', category: 'Owner', aliases: ['botstop'], cooldown: 5, usage: 'stopbot', type: 'bot',
  description: 'Informa al dueño sobre la parada permanente, administrada desde el despliegue.',
  run: (client, message, args) => runOwnerOperation(client, message, args, 'stop'),
}
