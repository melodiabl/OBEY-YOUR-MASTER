const { runPrefixThreadSettings } = require('../../src/modules/moderation/discord/thread-settings-commands')

module.exports = {
  name: 'archivethread', category: 'Administration', aliases: ['athread', 'closethread'],
  description: 'Archiva un hilo', usage: 'archivethread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadSettings(client, message, args, 'archivethread'),
}
