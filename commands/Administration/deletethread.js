const { runPrefixThreadAction } = require('../../src/modules/moderation/discord/thread-action-commands')

module.exports = {
  name: 'deletethread', category: 'Administration', aliases: ['deleteth'],
  description: 'Elimina un hilo', usage: 'deletethread [#hilo]', type: 'thread',
  memberpermissions: ['Administrador'],
  run: (client, message, args) => runPrefixThreadAction(client, message, args, 'deletethread'),
}
