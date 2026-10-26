const { runPrefixRoleMute } = require('../../src/modules/moderation')

module.exports = {
  name: 'tempmute', category: 'Administration', aliases: [''], cooldown: 4,
  usage: 'tempmute @Usuario <10m> [razón]',
  description: 'Silencia temporalmente mediante un rol.', type: 'member',
  run: (client, message, args) => runPrefixRoleMute(client, message, args, 'tempmute'),
}
