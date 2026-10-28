const { runPrefixThreadAction } = require('../../src/modules/moderation/discord/thread-action-commands')

module.exports = {
  name: 'jointhreads', category: 'Administration', aliases: ['joinths', 'joinallthreads'],
  description: 'Une el bot a los hilos activos que le faltan', usage: 'jointhreads', type: 'thread',
  run: (client, message, args) => runPrefixThreadAction(client, message, args, 'jointhreads'),
}
