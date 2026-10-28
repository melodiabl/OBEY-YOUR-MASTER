const { runPrefixChannelLock } = require('../../src/modules/moderation/discord/channel-lock-commands')

module.exports = {
  name: 'lockchannel', category: 'Administration', aliases: ['lockch', 'lchannel'],
  description: 'Bloquea el envío en un canal de texto',
  usage: 'lockchannel [#canal] [@rol o @usuario]', type: 'channel',
  run: (client, message, args) => runPrefixChannelLock(client, message, args, 'lockchannel'),
}
