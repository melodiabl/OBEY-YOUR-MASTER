const { runOwnerOperation } = require('../../handlers/owner-operations-command')
module.exports = {
  name: 'botfilename', category: 'Owner', aliases: ['originalbotname'], cooldown: 5, usage: 'botfilename', type: 'info',
  description: 'Muestra al dueño la identidad y las versiones del bot sin datos internos del servidor.',
  run: (client, message, args) => runOwnerOperation(client, message, args, 'identity'),
}
