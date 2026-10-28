const { runPrefixThreadSettings } = require('../../src/modules/moderation/discord/thread-settings-commands')

module.exports = {
  name: 'unarchivethread', category: 'Administration', aliases: ['unathread', 'unclosethread', 'openthread', 'othread'],
  description: 'Reabre un hilo archivado', usage: 'unarchivethread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadSettings(client, message, args, 'unarchivethread'),
}
