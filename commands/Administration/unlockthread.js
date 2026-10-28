const { runPrefixThreadSettings } = require('../../src/modules/moderation/discord/thread-settings-commands')

module.exports = {
  name: 'unlockthread', category: 'Administration', aliases: ['unlockth', 'unlthread'],
  description: 'Permite reabrir un hilo', usage: 'unlockthread [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadSettings(client, message, args, 'unlockthread'),
}
