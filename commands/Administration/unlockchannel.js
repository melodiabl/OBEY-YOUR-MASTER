const { runPrefixChannelLock } = require('../../src/modules/moderation/discord/channel-lock-commands')

module.exports = {
  name: 'unlockchannel', category: 'Administration', aliases: ['unlockch', 'unlchannel'],
  description: 'Desbloquea el envío en un canal de texto',
  usage: 'unlockchannel [#canal] [@rol o @usuario]', type: 'channel',
  run: (client, message, args) => runPrefixChannelLock(client, message, args, 'unlockchannel'),
}
