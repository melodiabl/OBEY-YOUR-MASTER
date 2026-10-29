const { runOwnerOperation } = require('../../handlers/owner-operations-command')
module.exports = {
  name: 'reloadbot', category: 'Owner', aliases: ['botreload'], cooldown: 5, usage: 'reloadbot', type: 'info',
  description: 'Informa al dueño sobre la recarga en caliente desactivada y el reinicio controlado.',
  run: (client, message, args) => runOwnerOperation(client, message, args, 'reload'),
}
