const { runPrefixThreadSettings } = require('../../src/modules/moderation/discord/thread-settings-commands')

module.exports = {
  name: 'lockthread', category: 'Administration', aliases: ['lockth', 'lthread'],
  description: 'Bloquea la reapertura de un hilo', usage: 'lockthread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadSettings(client, message, args, 'lockthread'),
}
