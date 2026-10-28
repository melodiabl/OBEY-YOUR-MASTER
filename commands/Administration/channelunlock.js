const { runPrefixChannelLock } = require('../../src/modules/moderation/discord/channel-lock-commands')

module.exports = {
  name: 'channelunlock', category: 'Administration', aliases: ['chunlock', 'unlockchannel', 'unlockch'],
  cooldown: 2,
  description: 'Desbloquea el envío en un canal de texto',
  usage: 'channelunlock [#canal] [@rol o @usuario]', type: 'channel',
  run: (client, message, args) => runPrefixChannelLock(client, message, args, 'channelunlock'),
}
