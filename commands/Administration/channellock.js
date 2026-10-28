const { runPrefixChannelLock } = require('../../src/modules/moderation/discord/channel-lock-commands')

module.exports = {
  name: 'channellock', category: 'Administration', aliases: ['chlock', 'lockchannel', 'lockch'],
  cooldown: 2,
  description: 'Bloquea el envío en un canal de texto',
  usage: 'channellock [#canal] [@rol o @usuario]', type: 'channel',
  run: (client, message, args) => runPrefixChannelLock(client, message, args, 'channellock'),
}
