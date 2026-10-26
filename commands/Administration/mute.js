const { runPrefixRoleMute } = require('../../src/modules/moderation')

module.exports = {
  name: 'mute', category: 'Administration', aliases: [''], cooldown: 4,
  usage: 'mute @Usuario <10m / perma> [razón]',
  description: 'Silencia con timeout o con el rol configurado.', type: 'member',
  run: (client, message, args) => runPrefixRoleMute(client, message, args, 'mute'),
}
