const { runPrefixThreadAction } = require('../../src/modules/moderation/discord/thread-action-commands')

module.exports = {
  name: 'jointhread', category: 'Administration', aliases: ['jointh'],
  description: 'Une el bot a un hilo activo', usage: 'jointhread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadAction(client, message, args, 'jointhread'),
}
