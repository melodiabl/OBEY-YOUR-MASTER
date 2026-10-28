const { runPrefixSlowmode } = require('../../src/modules/moderation/discord/slowmode-commands')

module.exports = {
  name: 'slowmode', category: 'Administration', aliases: ['slow'],
  description: 'Cambia el modo lento del canal actual', usage: 'slowmode <segundos: 0-21600>', type: 'channel',
  run: (client, message, args) => runPrefixSlowmode(client, message, args),
}
