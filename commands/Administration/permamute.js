const { runPrefixRoleMute } = require('../../src/modules/moderation')

module.exports = {
  name: 'permamute', category: 'Administration', aliases: [''], cooldown: 4,
  usage: 'permamute @Usuario [razón]',
  description: 'Silencia mediante un rol hasta retirarlo.', type: 'member',
  run: (client, message, args) => runPrefixRoleMute(client, message, args, 'permamute'),
}
