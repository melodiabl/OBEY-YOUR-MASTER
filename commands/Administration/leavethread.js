const { runPrefixThreadAction } = require('../../src/modules/moderation/discord/thread-action-commands')

module.exports = {
  name: 'leavethread', category: 'Administration', aliases: ['leaveth'],
  description: 'Saca el bot de un hilo', usage: 'leavethread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadAction(client, message, args, 'leavethread'),
}
